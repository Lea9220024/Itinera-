import { supabase } from '../lib/supabase/client';
import { StorageService } from './StorageService';
import { SupabaseStorageService } from './SupabaseStorageService';
import { Trip, StorageError } from '../types';

export const MIGRATION_VERSION_KEY = 'itinera_migration_version';
export const MIGRATION_MAP_KEY = 'itinera_migration_map_v1';
export const CURRENT_MIGRATION_VERSION = '2.1.0';

export interface MigrationStatus { hasLocalData: boolean; localTripCount: number; isMigrated: boolean; }
export interface MigrationReport { tripId: string; cloudTripId?: string; daysMigrated: number; activitiesMigrated: number; expensesMigrated: number; checklistMigrated: number; memoriesMigrated: number; errors: string[]; status: 'success'|'failed'|'partial'; }

const counts = (trip: Trip) => ({ days: trip.days.length, activities: trip.days.reduce((n, d) => n + d.activities.length, 0), expenses: trip.expenses.length, checklist: trip.checklist.length, memories: trip.memories.length });

export class MigrationService {
  static async checkMigrationStatus(): Promise<MigrationStatus> {
    try {
      const raw = localStorage.getItem('itinera_trips_v1');
      const version = localStorage.getItem(MIGRATION_VERSION_KEY);
      const trips: Trip[] = raw ? JSON.parse(raw) : [];
      const hasLocalData = Array.isArray(trips) && trips.length > 0;
      return { hasLocalData, localTripCount: hasLocalData ? trips.length : 0, isMigrated: !hasLocalData || version === CURRENT_MIGRATION_VERSION };
    } catch {
      return { hasLocalData: false, localTripCount: 0, isMigrated: false };
    }
  }

  static async migrateLocalDataToSupabase(): Promise<{ success: boolean; migratedCount: number; reports: MigrationReport[]; error?: string }> {
    if (!supabase) return { success: false, migratedCount: 0, reports: [], error: 'Supabase no está configurado.' };
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) return { success: false, migratedCount: 0, reports: [], error: 'Usuario no autenticado.' };
    const localTrips = await StorageService.getTrips();
    if (!localTrips.length) { localStorage.setItem(MIGRATION_VERSION_KEY, CURRENT_MIGRATION_VERSION); return { success: true, migratedCount: 0, reports: [] }; }

    let idMap: Record<string, string> = {};
    try { idMap = JSON.parse(localStorage.getItem(MIGRATION_MAP_KEY) || '{}'); } catch { idMap = {}; }
    const storage = new SupabaseStorageService();
    const reports: MigrationReport[] = [];

    for (const localTrip of localTrips) {
      const report: MigrationReport = { tripId: localTrip.id, daysMigrated: 0, activitiesMigrated: 0, expensesMigrated: 0, checklistMigrated: 0, memoriesMigrated: 0, errors: [], status: 'failed' };
      try {
        const mappedId = idMap[localTrip.id];
        const candidate = mappedId ? { ...localTrip, id: mappedId, userId: session.user.id } : { ...localTrip, userId: session.user.id };
        const saved = await storage.saveTrip(candidate);
        report.cloudTripId = saved.id;
        const verified = await storage.getTripById(saved.id);
        if (!verified) throw new StorageError('El viaje migrado no pudo recuperarse para verificación.');
        const expected = counts(localTrip);
        const actual = counts(verified);
        report.daysMigrated = actual.days; report.activitiesMigrated = actual.activities; report.expensesMigrated = actual.expenses; report.checklistMigrated = actual.checklist; report.memoriesMigrated = actual.memories;
        if (JSON.stringify(expected) !== JSON.stringify(actual)) throw new StorageError('Mismatch de integridad: esperado ' + JSON.stringify(expected) + ', obtenido ' + JSON.stringify(actual));
        idMap[localTrip.id] = saved.id;
        localStorage.setItem(MIGRATION_MAP_KEY, JSON.stringify(idMap));
        report.status = 'success';
      } catch (e: any) {
        report.errors.push(e?.message || 'Error de migración');
        report.status = 'failed';
      }
      reports.push(report);
    }

    const allSuccess = reports.length === localTrips.length && reports.every(r => r.status === 'success');
    if (!allSuccess) return { success: false, migratedCount: reports.filter(r => r.status === 'success').length, reports, error: 'Migración incompleta. Los datos locales se conservaron.' };
    localStorage.setItem(MIGRATION_VERSION_KEY, CURRENT_MIGRATION_VERSION);
    return { success: true, migratedCount: reports.length, reports };
  }
}
