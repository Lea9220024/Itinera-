import { supabase } from '../lib/supabase/client';
import { IStorageService } from './StorageService';
import { Trip, DayPlan, Activity, Expense, ChecklistItem, Memory, UserPreferences, StorageError } from '../types';

/**
 * Checks if a string conforms to the standard UUID v4 format
 */
export function isValidUuid(id?: string | null): boolean {
  if (!id || typeof id !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

export class SupabaseStorageService implements IStorageService {
  private async getUserId(): Promise<string> {
    if (!supabase) throw new StorageError('Supabase no está configurado.');
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      throw new StorageError('Usuario no autenticado.');
    }
    return session.user.id;
  }

  async getTrips(): Promise<Trip[]> {
    if (!supabase) return [];
    try {
      const userId = await this.getUserId();

      const { data: dbTrips, error: tripsError } = await supabase
        .from('trips')
        .select('*')
        .eq('user_id', userId)
        .order('start_date', { ascending: false });

      if (tripsError) throw tripsError;
      if (!dbTrips || dbTrips.length === 0) return [];

      const trips: Trip[] = [];

      for (const t of dbTrips) {
        // Load days
        const { data: dbDays } = await supabase
          .from('trip_days')
          .select('*')
          .eq('trip_id', t.id)
          .order('day_number', { ascending: true });

        // Load activities for all days of this trip
        const dayIds = (dbDays || []).map((d) => d.id);
        let allActivities: any[] = [];
        if (dayIds.length > 0) {
          const { data: dbActs } = await supabase
            .from('activities')
            .select('*')
            .in('trip_day_id', dayIds)
            .order('start_time', { ascending: true });
          allActivities = dbActs || [];
        }

        // Load expenses
        const { data: dbExpenses } = await supabase
          .from('expenses')
          .select('*')
          .eq('trip_id', t.id)
          .order('date', { ascending: true });

        // Load checklist
        const { data: dbChecklist } = await supabase
          .from('checklist_items')
          .select('*')
          .eq('trip_id', t.id)
          .order('sort_order', { ascending: true });

        // Load memories
        const { data: dbMemories } = await supabase
          .from('memories')
          .select('*')
          .eq('trip_id', t.id)
          .order('date', { ascending: true });

        const days: DayPlan[] = (dbDays || []).map((d) => ({
          id: d.id,
          tripId: t.id,
          dayNumber: d.day_number,
          date: d.date,
          city: d.city,
          theme: d.notes || undefined,
          activities: allActivities
            .filter((a) => a.trip_day_id === d.id)
            .map((a) => ({
              id: a.id,
              dayId: d.id,
              name: a.name,
              description: a.description || '',
              category: a.category,
              startTime: a.start_time,
              endTime: a.end_time,
              durationMinutes: a.duration_minutes,
              location: a.location_name || a.address || '',
              latitude: Number(a.latitude) || 0,
              longitude: Number(a.longitude) || 0,
              estimatedCost: Number(a.estimated_cost) || 0,
              currency: a.currency || t.budget_currency,
              notes: a.notes || undefined,
              completed: a.status === 'completed',
              sortOrder: a.sort_order,
            })),
        }));

        const expenses: Expense[] = (dbExpenses || []).map((e) => ({
          id: e.id,
          tripId: t.id,
          category: e.category,
          description: e.description,
          amount: Number(e.amount),
          currency: e.currency,
          date: e.date,
        }));

        const checklist: ChecklistItem[] = (dbChecklist || []).map((c) => ({
          id: c.id,
          tripId: t.id,
          phase: 'before',
          category: c.category,
          title: c.title,
          completed: c.completed,
        }));

        const memories: Memory[] = (dbMemories || []).map((m) => ({
          id: m.id,
          tripId: t.id,
          date: m.date,
          location: m.location || '',
          title: m.title,
          note: m.description || '',
          rating: 5,
          imageUrl: m.image_url || undefined,
          tags: [],
        }));

        const diffDays = Math.ceil(
          Math.abs(new Date(t.end_date).getTime() - new Date(t.start_date).getTime()) /
            (1000 * 60 * 60 * 24)
        ) + 1;

        trips.push({
          id: t.id,
          userId: t.user_id,
          name: t.name,
          destination: t.destination,
          destinationsList: Array.from(new Set(days.map((d) => d.city))),
          country: t.destination.split('(')[0].trim() || 'Destino',
          startDate: t.start_date,
          endDate: t.end_date,
          totalDays: Math.max(1, diffDays),
          totalNights: Math.max(0, diffDays - 1),
          travelers: {
            adults: t.travelers_count || 2,
            children: 0,
            profile: 'couple',
          },
          budgetTotal: Number(t.budget_amount) || 0,
          budgetTier: 'medium',
          currency: t.budget_currency || '€',
          pace: (t.travel_style as any) || 'balanced',
          interests: [],
          status: t.status as any,
          coverImage: t.cover_image_url || '/src/assets/images/hero_italy_amalfi_1791169026085.jpg',
          summary: t.description || '',
          days,
          expenses,
          checklist,
          memories,
          createdAt: t.created_at,
          updatedAt: t.updated_at,
        });
      }

      return trips;
    } catch (err: any) {
      console.error('SupabaseStorageService.getTrips failed:', err);
      return [];
    }
  }

  async getTripById(id: string): Promise<Trip | null> {
    const trips = await this.getTrips();
    return trips.find((t) => t.id === id) || null;
  }

  async saveTrip(trip: Trip): Promise<Trip> {
    if (!supabase) throw new StorageError('Supabase no está disponible.');
    const userId = await this.getUserId();

    const tripRecord: Record<string, any> = {
      user_id: userId,
      name: trip.name,
      destination: trip.destination,
      description: trip.summary || '',
      start_date: trip.startDate,
      end_date: trip.endDate,
      travelers_count: (trip.travelers?.adults || 2) + (trip.travelers?.children || 0),
      budget_amount: trip.budgetTotal,
      budget_currency: trip.currency,
      travel_style: trip.pace,
      status: trip.status,
      cover_image_url: trip.coverImage,
    };

    let actualTripId = trip.id;

    // 1. Insert or Upsert Trip based on valid UUID format
    if (isValidUuid(trip.id)) {
      tripRecord.id = trip.id;
      const { data, error } = await supabase
        .from('trips')
        .upsert(tripRecord, { onConflict: 'id' })
        .select()
        .single();
      if (error) throw new StorageError(`Error al actualizar viaje en Supabase: ${error.message}`);
      actualTripId = data.id;
    } else {
      // New trip from local storage with string ID: insert without ID to generate fresh UUID
      const { data, error } = await supabase
        .from('trips')
        .insert(tripRecord)
        .select()
        .single();
      if (error) throw new StorageError(`Error al insertar viaje en Supabase: ${error.message}`);
      actualTripId = data.id;
    }

    // 2. Synchronize days
    const savedDayIds: string[] = [];
    for (const day of trip.days) {
      const dayRecord: Record<string, any> = {
        trip_id: actualTripId,
        day_number: day.dayNumber,
        date: day.date,
        city: day.city,
        notes: day.theme || null,
      };

      if (isValidUuid(day.id)) {
        dayRecord.id = day.id;
      }

      const { data: savedDayData, error: dayErr } = await supabase
        .from('trip_days')
        .upsert(dayRecord, { onConflict: 'trip_id,day_number' })
        .select()
        .single();

      if (dayErr || !savedDayData?.id) { throw new StorageError('Error guardando día ' + day.dayNumber + ': ' + (dayErr?.message || 'respuesta inválida')); }

      const actualDayId = savedDayData.id;
      savedDayIds.push(actualDayId);

      // 3. Synchronize activities for this day
      const currentActIds: string[] = [];
      for (let idx = 0; idx < day.activities.length; idx++) {
        const act = day.activities[idx];
        const actRecord: Record<string, any> = {
          trip_day_id: actualDayId,
          name: act.name,
          description: act.description,
          category: act.category,
          start_time: act.startTime,
          end_time: act.endTime,
          duration_minutes: act.durationMinutes,
          location_name: act.location,
          latitude: act.latitude,
          longitude: act.longitude,
          estimated_cost: act.estimatedCost,
          currency: act.currency,
          notes: act.notes || null,
          status: act.completed ? 'completed' : 'pending',
          sort_order: idx,
        };

        if (isValidUuid(act.id)) {
          actRecord.id = act.id;
          const { data: actSaved, error: actErr } = await supabase
            .from('activities')
            .upsert(actRecord, { onConflict: 'id' })
            .select()
            .single();
          if (actErr || !actSaved?.id) throw new StorageError('Error guardando actividad: ' + (actErr?.message || 'respuesta inválida')); currentActIds.push(actSaved.id);
        } else {
          const { data: actSaved, error: actErr } = await supabase
            .from('activities')
            .insert(actRecord)
            .select()
            .single();
          if (actErr || !actSaved?.id) throw new StorageError('Error guardando actividad: ' + (actErr?.message || 'respuesta inválida')); currentActIds.push(actSaved.id);
        }
      }

      // Reconcile: delete removed activities for this day
      if (currentActIds.length > 0) {
        await supabase.from('activities').delete().eq('trip_day_id', actualDayId).not('id', 'in', `(${currentActIds.join(',')})`);
      } else {
        await supabase.from('activities').delete().eq('trip_day_id', actualDayId);
      }
    }

    // Delete removed days
    if (savedDayIds.length > 0) {
      await supabase.from('trip_days').delete().eq('trip_id', actualTripId).not('id', 'in', `(${savedDayIds.join(',')})`);
    } else {
      await supabase.from('trip_days').delete().eq('trip_id', actualTripId);
    }

    // 4. Synchronize Expenses
    const currentExpIds: string[] = [];
    for (const exp of trip.expenses) {
      const expRecord: Record<string, any> = {
        trip_id: actualTripId,
        category: exp.category,
        description: exp.description,
        amount: exp.amount,
        currency: exp.currency,
        date: exp.date,
      };

      if (isValidUuid(exp.id)) {
        expRecord.id = exp.id;
        const { data: expSaved, error: expErr } = await supabase
          .from('expenses')
          .upsert(expRecord, { onConflict: 'id' })
          .select()
          .single();
        if (expErr || !expSaved?.id) throw new StorageError('Error guardando gasto: ' + (expErr?.message || 'respuesta inválida')); currentExpIds.push(expSaved.id);
      } else {
        const { data: expSaved, error: expErr } = await supabase
          .from('expenses')
          .insert(expRecord)
          .select()
          .single();
        if (expErr || !expSaved?.id) throw new StorageError('Error guardando gasto: ' + (expErr?.message || 'respuesta inválida')); currentExpIds.push(expSaved.id);
      }
    }

    if (currentExpIds.length > 0) {
      await supabase.from('expenses').delete().eq('trip_id', actualTripId).not('id', 'in', `(${currentExpIds.join(',')})`);
    } else {
      await supabase.from('expenses').delete().eq('trip_id', actualTripId);
    }

    // 5. Synchronize Checklist
    const currentChkIds: string[] = [];
    for (let idx = 0; idx < trip.checklist.length; idx++) {
      const chk = trip.checklist[idx];
      const chkRecord: Record<string, any> = {
        trip_id: actualTripId,
        title: chk.title,
        category: chk.category,
        completed: chk.completed,
        sort_order: idx,
      };

      if (isValidUuid(chk.id)) {
        chkRecord.id = chk.id;
        const { data: chkSaved, error: chkErr } = await supabase
          .from('checklist_items')
          .upsert(chkRecord, { onConflict: 'id' })
          .select()
          .single();
        if (chkErr || !chkSaved?.id) throw new StorageError('Error guardando checklist: ' + (chkErr?.message || 'respuesta inválida')); currentChkIds.push(chkSaved.id);
      } else {
        const { data: chkSaved, error: chkErr } = await supabase
          .from('checklist_items')
          .insert(chkRecord)
          .select()
          .single();
        if (chkErr || !chkSaved?.id) throw new StorageError('Error guardando checklist: ' + (chkErr?.message || 'respuesta inválida')); currentChkIds.push(chkSaved.id);
      }
    }

    if (currentChkIds.length > 0) {
      await supabase.from('checklist_items').delete().eq('trip_id', actualTripId).not('id', 'in', `(${currentChkIds.join(',')})`);
    } else {
      await supabase.from('checklist_items').delete().eq('trip_id', actualTripId);
    }

    // 6. Synchronize Memories
    const currentMemIds: string[] = [];
    for (const mem of trip.memories) {
      const memRecord: Record<string, any> = {
        trip_id: actualTripId,
        title: mem.title,
        description: mem.note,
        image_url: mem.imageUrl || null,
        date: mem.date,
        location: mem.location,
      };

      if (isValidUuid(mem.id)) {
        memRecord.id = mem.id;
        const { data: memSaved, error: memErr } = await supabase
          .from('memories')
          .upsert(memRecord, { onConflict: 'id' })
          .select()
          .single();
        if (memErr || !memSaved?.id) throw new StorageError('Error guardando memoria: ' + (memErr?.message || 'respuesta inválida')); currentMemIds.push(memSaved.id);
      } else {
        const { data: memSaved, error: memErr } = await supabase
          .from('memories')
          .insert(memRecord)
          .select()
          .single();
        if (memErr || !memSaved?.id) throw new StorageError('Error guardando memoria: ' + (memErr?.message || 'respuesta inválida')); currentMemIds.push(memSaved.id);
      }
    }

    if (currentMemIds.length > 0) {
      await supabase.from('memories').delete().eq('trip_id', actualTripId).not('id', 'in', `(${currentMemIds.join(',')})`);
    } else {
      await supabase.from('memories').delete().eq('trip_id', actualTripId);
    }

    return { ...trip, id: actualTripId, userId };
  }

  async deleteTrip(id: string): Promise<boolean> {
    if (!supabase) return false;
    const { error } = await supabase.from('trips').delete().eq('id', id);
    return !error;
  }

  async duplicateTrip(id: string): Promise<Trip | null> {
    const original = await this.getTripById(id);
    if (!original) return null;

    const duplicated: Trip = {
      ...original,
      id: crypto.randomUUID ? crypto.randomUUID() : `trip-${Date.now()}`,
      name: `${original.name} (Copia)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      days: original.days.map((d, dIdx) => ({
        ...d,
        id: crypto.randomUUID ? crypto.randomUUID() : `day-${Date.now()}-${dIdx}`,
        activities: d.activities.map((a, aIdx) => ({
          ...a,
          id: crypto.randomUUID ? crypto.randomUUID() : `act-${Date.now()}-${dIdx}-${aIdx}`,
          completed: false,
        })),
      })),
      memories: [],
    };

    return this.saveTrip(duplicated);
  }

  async getActiveTripId(): Promise<string | null> {
    try {
      const active = localStorage.getItem('itinera_active_trip_id_v1');
      if (active) return active;
      const trips = await this.getTrips();
      if (trips.length > 0) return trips[0].id;
    } catch {}
    return null;
  }

  async setActiveTripId(id: string): Promise<void> {
    try {
      localStorage.setItem('itinera_active_trip_id_v1', id);
    } catch {}
  }

  async getUserPreferences(): Promise<UserPreferences> {
    const defaultPrefs: UserPreferences = {
      gastronomy: 8,
      nature: 7,
      history: 9,
      relax: 6,
      adventure: 5,
      culture: 8,
      preferredCurrency: '€',
      language: 'es',
    };

    if (!supabase) return defaultPrefs;
    try {
      const userId = await this.getUserId();
      const { data } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (data?.travel_style) {
        return {
          ...defaultPrefs,
          ...data.travel_style,
          preferredCurrency: data.preferred_currency || '€',
        };
      }
    } catch {}

    return defaultPrefs;
  }

  async saveUserPreferences(prefs: UserPreferences): Promise<UserPreferences> {
    if (!supabase) return prefs;
    try {
      const userId = await this.getUserId();
      await supabase.from('user_preferences').upsert(
        {
          user_id: userId,
          travel_style: {
            gastronomy: prefs.gastronomy,
            nature: prefs.nature,
            history: prefs.history,
            relax: prefs.relax,
            adventure: prefs.adventure,
            culture: prefs.culture,
          },
          preferred_currency: prefs.preferredCurrency,
        },
        { onConflict: 'user_id' }
      );
    } catch (e) {
      console.warn('Error saving user preferences to Supabase:', e);
    }
    return prefs;
  }

  async resetToDemo(): Promise<Trip[]> {
    return this.getTrips();
  }
}
