import { INITIAL_DEMO_TRIP } from '../data/demoTrip';
import { Trip, UserPreferences } from '../types';

export interface IStorageService {
  getTrips(): Promise<Trip[]>;
  getTripById(id: string): Promise<Trip | null>;
  saveTrip(trip: Trip): Promise<Trip>;
  deleteTrip(id: string): Promise<boolean>;
  duplicateTrip(id: string): Promise<Trip | null>;
  getActiveTripId(): Promise<string | null>;
  setActiveTripId(id: string): Promise<void>;
  getUserPreferences(): Promise<UserPreferences>;
  saveUserPreferences(prefs: UserPreferences): Promise<UserPreferences>;
  resetToDemo(): Promise<Trip[]>;
}

const TRIPS_KEY = 'itinera_trips_v1';
const ACTIVE_TRIP_KEY = 'itinera_active_trip_id_v1';
const PREFS_KEY = 'itinera_user_prefs_v1';

const DEFAULT_PREFERENCES: UserPreferences = {
  gastronomy: 8,
  nature: 7,
  history: 9,
  relax: 6,
  adventure: 5,
  culture: 8,
  preferredCurrency: '€',
  language: 'es',
};

class LocalStorageService implements IStorageService {
  private ensureInitialized(): Trip[] {
    try {
      const stored = localStorage.getItem(TRIPS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('StorageService: error reading localStorage, initializing demo trip', e);
    }

    // Default initialization with authentic demo trip
    const initial = [INITIAL_DEMO_TRIP];
    this.persistTrips(initial);
    try {
      localStorage.setItem(ACTIVE_TRIP_KEY, INITIAL_DEMO_TRIP.id);
    } catch {}
    return initial;
  }

  private persistTrips(trips: Trip[]): void {
    try {
      localStorage.setItem(TRIPS_KEY, JSON.stringify(trips));
    } catch (e) {
      console.error('StorageService: failed to persist trips', e);
    }
  }

  async getTrips(): Promise<Trip[]> {
    return this.ensureInitialized();
  }

  async getTripById(id: string): Promise<Trip | null> {
    const trips = this.ensureInitialized();
    const found = trips.find((t) => t.id === id);
    return found || null;
  }

  async saveTrip(trip: Trip): Promise<Trip> {
    const trips = this.ensureInitialized();
    const now = new Date().toISOString();
    const updatedTrip = { ...trip, updatedAt: now };

    const index = trips.findIndex((t) => t.id === trip.id);
    if (index >= 0) {
      trips[index] = updatedTrip;
    } else {
      trips.unshift(updatedTrip);
    }

    this.persistTrips(trips);
    return updatedTrip;
  }

  async deleteTrip(id: string): Promise<boolean> {
    const trips = this.ensureInitialized();
    const filtered = trips.filter((t) => t.id !== id);
    if (filtered.length === trips.length) return false;

    this.persistTrips(filtered);
    const active = await this.getActiveTripId();
    if (active === id && filtered.length > 0) {
      await this.setActiveTripId(filtered[0].id);
    }
    return true;
  }

  async duplicateTrip(id: string): Promise<Trip | null> {
    const original = await this.getTripById(id);
    if (!original) return null;

    const newId = `trip-${Date.now()}`;
    const duplicated: Trip = {
      ...original,
      id: newId,
      name: `${original.name} (Copia)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      days: original.days.map((d, index) => ({
        ...d,
        id: `day-${newId}-${index + 1}`,
        tripId: newId,
        activities: d.activities.map((a, actIndex) => ({
          ...a,
          id: `act-${newId}-${index + 1}-${actIndex + 1}`,
          dayId: `day-${newId}-${index + 1}`,
          completed: false,
        })),
      })),
      checklist: original.checklist.map((c, i) => ({
        ...c,
        id: `chk-${newId}-${i + 1}`,
        tripId: newId,
        completed: false,
      })),
      memories: [],
    };

    await this.saveTrip(duplicated);
    await this.setActiveTripId(newId);
    return duplicated;
  }

  async getActiveTripId(): Promise<string | null> {
    try {
      const active = localStorage.getItem(ACTIVE_TRIP_KEY);
      if (active) return active;
      const trips = this.ensureInitialized();
      if (trips.length > 0) return trips[0].id;
    } catch {}
    return null;
  }

  async setActiveTripId(id: string): Promise<void> {
    try {
      localStorage.setItem(ACTIVE_TRIP_KEY, id);
    } catch {}
  }

  async getUserPreferences(): Promise<UserPreferences> {
    try {
      const data = localStorage.getItem(PREFS_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch {}
    return DEFAULT_PREFERENCES;
  }

  async saveUserPreferences(prefs: UserPreferences): Promise<UserPreferences> {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch {}
    return prefs;
  }

  async resetToDemo(): Promise<Trip[]> {
    const demo = [INITIAL_DEMO_TRIP];
    this.persistTrips(demo);
    await this.setActiveTripId(INITIAL_DEMO_TRIP.id);
    return demo;
  }
}

// Export singleton instance. Can be swapped for SupabaseStorageService seamlessly.
export const StorageService: IStorageService = new LocalStorageService();
