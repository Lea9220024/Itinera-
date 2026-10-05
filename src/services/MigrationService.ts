import { supabase } from '../lib/supabase/client';
import { StorageService } from './StorageService';
import { SupabaseStorageService } from './SupabaseStorageService';
import { Trip, StorageError } from '../types';

export const MIGRATION_VERSION_KEY = 'itinera_migration_version';
export const CURRENT_MIGRATION_VERSION = '2.0.0';

export interface MigrationStatus {
  hasLocalData: boolean;
  localTripCount: number;
  isMigrated: boolean;
}

export class MigrationService {
  /**
   * Checks if there are local trips in localStorage that have not yet been migrated
   */
  static async checkMigrationStatus(): Promise<MigrationStatus> {
    try {
      const localTripsJson = localStorage.getItem('itinera_trips_v1');
      const migrationVersion = localStorage.getItem(MIGRATION_VERSION_KEY);

      if (!localTripsJson) {
        return { hasLocalData: false, localTripCount: 0, isMigrated: true };
      }

      const trips: Trip[] = JSON.parse(localTripsJson);
      const hasLocalData = Array.isArray(trips) && trips.length > 0;
      const isMigrated = migrationVersion === CURRENT_MIGRATION_VERSION;

      return {
        hasLocalData,
        localTripCount: hasLocalData ? trips.length : 0,
        isMigrated,
      };
    } catch {
      return { hasLocalData: false, localTripCount: 0, isMigrated: false };
    }
  }

  /**
   * Executes the non-destructive migration of all local trips into the authenticated user's Supabase account.
   */
  static async migrateLocalDataToSupabase(): Promise<{
    success: boolean;
    migratedCount: number;
    error?: string;
  }> {
    if (!supabase) {
      return { success: false, migratedCount: 0, error: 'Supabase no está configurado.' };
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user?.id) {
      return { success: false, migratedCount: 0, error: 'Inicia sesión para sincronizar tus viajes locales.' };
    }

    try {
      const localTrips = await StorageService.getTrips();
      if (!localTrips || localTrips.length === 0) {
        localStorage.setItem(MIGRATION_VERSION_KEY, CURRENT_MIGRATION_VERSION);
        return { success: true, migratedCount: 0 };
      }

      const supabaseStorage = new SupabaseStorageService();
      let migrated = 0;

      for (const trip of localTrips) {
        // Save to Supabase with proper user ownership
        await supabaseStorage.saveTrip({
          ...trip,
          userId: session.user.id,
        });
        migrated++;
      }

      // Verify integrity: Query back to ensure at least one trip is confirmed in Supabase
      const verifiedTrips = await supabaseStorage.getTrips();
      if (verifiedTrips.length === 0 && migrated > 0) {
        throw new StorageError('Fallo en la verificación de integridad de la migración.');
      }

      // Only mark migration complete AFTER confirmed verification
      localStorage.setItem(MIGRATION_VERSION_KEY, CURRENT_MIGRATION_VERSION);

      return {
        success: true,
        migratedCount: migrated,
      };
    } catch (err: any) {
      console.error('Error during migration to Supabase:', err);
      return {
        success: false,
        migratedCount: 0,
        error: err.message || 'Error durante la migración a Supabase.',
      };
    }
  }
}
