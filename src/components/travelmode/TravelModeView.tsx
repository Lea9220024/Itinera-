import React, { useState } from 'react';
import {
  Compass,
  MapPin,
  Clock,
  CheckCircle2,
  Circle,
  Navigation,
  ArrowRight,
  ChevronRight,
  ArrowLeft,
  Sparkles,
  Layers,
} from 'lucide-react';
import { Trip, Activity } from '../../types';
import { MapService } from '../../services/MapService';

interface TravelModeViewProps {
  trip: Trip;
  onExitTravelMode: () => void;
  onUpdateTrip: (updated: Trip) => void;
  onOpenMap: () => void;
}

export const TravelModeView: React.FC<TravelModeViewProps> = ({
  trip,
  onExitTravelMode,
  onUpdateTrip,
  onOpenMap,
}) => {
  // Current active day (defaults to Day 1 or ongoing day)
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const currentDay = trip.days[activeDayIndex] || trip.days[0];

  const activities = currentDay?.activities || [];

  // Separate into Now, Next, Later
  // If first activity not completed, it's NOW; if completed, find the first incomplete one
  const firstIncompleteIdx = activities.findIndex((a) => !a.completed);
  const nowIdx = firstIncompleteIdx === -1 ? activities.length - 1 : firstIncompleteIdx;

  const currentActivity: Activity | undefined = activities[nowIdx];
  const nextActivity: Activity | undefined = activities[nowIdx + 1];
  const laterActivities: Activity[] = activities.slice(nowIdx + 2);

  const toggleComplete = (activityId: string) => {
    if (!currentDay) return;
    const updatedDays = trip.days.map((day) => {
      if (day.id === currentDay.id) {
        return {
          ...day,
          activities: day.activities.map((a) =>
            a.id === activityId ? { ...a, completed: !a.completed } : a
          ),
        };
      }
      return day;
    });
    onUpdateTrip({ ...trip, days: updatedDays });
  };

  const currentTheme = currentActivity
    ? MapService.getCategoryTheme(currentActivity.category)
    : null;

  return (
    <div className="space-y-6 pb-24 md:pb-12 max-w-2xl mx-auto">
      {/* Top Travel Mode Bar */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-800 text-white shadow-md">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onExitTravelMode}
            className="p-1.5 rounded-lg bg-emerald-900/60 hover:bg-emerald-900 transition-colors"
            title="Volver a la vista normal"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-200">
              Modo Viaje Activo
            </span>
            <h2 className="text-base font-bold font-serif">
              {currentDay ? `Día ${currentDay.dayNumber} · ${currentDay.city}` : trip.destination}
            </h2>
          </div>
        </div>

        {/* Day switch buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={activeDayIndex === 0}
            onClick={() => setActiveDayIndex((i) => Math.max(0, i - 1))}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-700 disabled:opacity-40"
          >
            Anterior
          </button>
          <button
            type="button"
            disabled={activeDayIndex === trip.days.length - 1}
            onClick={() => setActiveDayIndex((i) => Math.min(trip.days.length - 1, i + 1))}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-700 disabled:opacity-40"
          >
            Siguiente
          </button>
        </div>
      </div>

      {/* AHORA: Active Activity Focus Card */}
      {currentActivity && (
        <div className="p-6 rounded-3xl bg-white dark:bg-[#111918] border-2 border-emerald-600 dark:border-emerald-500 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-2">
            <span className="tracking-widest uppercase">● AHORA MISMO</span>
            <span className="font-mono text-sm">{currentActivity.startTime} — {currentActivity.endTime}</span>
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-stone-900 dark:text-stone-100 font-serif leading-tight">
              {currentActivity.name}
            </h3>

            <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
              {currentTheme && (
                <span style={{ color: currentTheme.color }} className="font-semibold">
                  {currentTheme.label}
                </span>
              )}
              <span>·</span>
              <span>{currentActivity.durationMinutes} minutos</span>
              <span>·</span>
              <span className="font-mono font-semibold text-stone-900 dark:text-stone-200">
                {trip.currency}{currentActivity.estimatedCost}
              </span>
            </div>

            <div className="flex items-start gap-1.5 text-xs text-stone-600 dark:text-stone-300 pt-1">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{currentActivity.location}</span>
            </div>

            {currentActivity.notes && (
              <div className="mt-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 text-xs">
                <strong>Nota:</strong> {currentActivity.notes}
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center justify-between gap-3 pt-4 border-t border-stone-100 dark:border-stone-800">
            <button
              type="button"
              onClick={onOpenMap}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-stone-700 dark:text-stone-200 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200"
            >
              <Navigation className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ver en mapa</span>
            </button>

            <button
              type="button"
              onClick={() => toggleComplete(currentActivity.id)}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-800 shadow-sm transition-transform active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{currentActivity.completed ? 'Completada ✓' : 'Marcar realizada'}</span>
            </button>
          </div>
        </div>
      )}

      {/* PRÓXIMO: Next Activity */}
      {nextActivity && (
        <div className="p-5 rounded-3xl bg-stone-50 dark:bg-[#151f1e] border border-stone-200 dark:border-stone-800 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-500 dark:text-stone-400 mb-1.5">
            <span className="uppercase tracking-wider">PRÓXIMA ACTIVIDAD</span>
            <span className="font-mono font-bold text-stone-900 dark:text-stone-100">
              {nextActivity.startTime}
            </span>
          </div>

          <div className="flex items-start justify-between gap-4">
            <div>
              <h4 className="text-lg font-bold text-stone-900 dark:text-stone-100 font-serif">
                {nextActivity.name}
              </h4>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 truncate max-w-sm">
                {nextActivity.location}
              </p>
            </div>

            {nextActivity.distanceFromPreviousKm && (
              <div className="text-right shrink-0">
                <span className="text-[11px] text-stone-400 block">Traslado aprox.</span>
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                  {nextActivity.distanceFromPreviousKm} km
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DESPUÉS: Later Today List */}
      {laterActivities.length > 0 && (
        <div className="p-5 rounded-3xl bg-white dark:bg-[#111918] border border-stone-200 dark:border-stone-800 shadow-xs space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-400 block">
            MÁS TARDE HOY
          </span>

          <div className="divide-y divide-stone-100 dark:divide-stone-800">
            {laterActivities.map((act) => (
              <div key={act.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-stone-500 dark:text-stone-400 w-12">
                    {act.startTime}
                  </span>
                  <span className="font-semibold text-stone-900 dark:text-stone-100">
                    {act.name}
                  </span>
                </div>
                <span className="text-stone-400 font-mono">{trip.currency}{act.estimatedCost}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Day Checklist */}
      <div className="p-5 rounded-3xl bg-white dark:bg-[#111918] border border-stone-200 dark:border-stone-800 shadow-xs space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
          Checklist rápido para hoy
        </h4>
        <div className="space-y-2">
          {trip.checklist.slice(0, 3).map((item) => (
            <div key={item.id} className="flex items-center gap-2.5 text-xs text-stone-700 dark:text-stone-300">
              <CheckCircle2
                className={`w-4 h-4 shrink-0 ${
                  item.completed ? 'text-emerald-600' : 'text-stone-300'
                }`}
              />
              <span className={item.completed ? 'line-through text-stone-400' : ''}>
                {item.title}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
