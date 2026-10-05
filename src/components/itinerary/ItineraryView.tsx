import React, { useState } from 'react';
import {
  Calendar,
  Plus,
  Sparkles,
  MapPin,
  Clock,
  Compass,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Navigation,
} from 'lucide-react';
import { Trip, DayPlan, Activity } from '../../types';
import { ActivityCard } from './ActivityCard';
import { ActivityModal } from './ActivityModal';
import { ActivityDetailModal } from './ActivityDetailModal';
import { OptimizerReportModal } from './OptimizerReportModal';
import { ItineraryOptimizer, TripOptimizationReport } from '../../services/ItineraryOptimizer';

interface ItineraryViewProps {
  trip: Trip;
  onUpdateTrip: (updated: Trip) => void;
  onOpenMap: () => void;
  onOpenAI: () => void;
  onOpenTravelMode: () => void;
}

export const ItineraryView: React.FC<ItineraryViewProps> = ({
  trip,
  onUpdateTrip,
  onOpenMap,
  onOpenAI,
  onOpenTravelMode,
}) => {
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [activityToEdit, setActivityToEdit] = useState<Activity | null>(null);
  const [detailActivity, setDetailActivity] = useState<Activity | null>(null);
  const [isOptimizerOpen, setIsOptimizerOpen] = useState(false);
  const [optimizerReport, setOptimizerReport] = useState<TripOptimizationReport | null>(null);

  // Move to day state
  const [movingActivityId, setMovingActivityId] = useState<string | null>(null);

  const currentDay: DayPlan | undefined = trip.days[selectedDayIndex];

  // Calculate day summary metrics
  const dayActivities = currentDay?.activities || [];
  const dayTotalCost = dayActivities.reduce((acc, a) => acc + (a.estimatedCost || 0), 0);
  const dayCompletedCount = dayActivities.filter((a) => a.completed).length;

  // Add / Edit Activity
  const handleSaveActivity = (activity: Activity) => {
    if (!currentDay) return;

    const updatedDays = trip.days.map((day) => {
      if (day.id === currentDay.id) {
        const existingIdx = day.activities.findIndex((a) => a.id === activity.id);
        let newActivities: Activity[];
        if (existingIdx >= 0) {
          newActivities = [...day.activities];
          newActivities[existingIdx] = activity;
        } else {
          newActivities = [...day.activities, activity];
        }
        // sort by startTime
        newActivities.sort((a, b) => a.startTime.localeCompare(b.startTime));
        return { ...day, activities: newActivities };
      }
      return day;
    });

    onUpdateTrip({ ...trip, days: updatedDays });
    setActivityToEdit(null);
  };

  // Delete Activity
  const handleDeleteActivity = (activityId: string) => {
    if (!currentDay) return;
    const updatedDays = trip.days.map((day) => {
      if (day.id === currentDay.id) {
        return {
          ...day,
          activities: day.activities.filter((a) => a.id !== activityId),
        };
      }
      return day;
    });
    onUpdateTrip({ ...trip, days: updatedDays });
  };

  // Duplicate Activity
  const handleDuplicateActivity = (activity: Activity) => {
    if (!currentDay) return;
    const duplicated: Activity = {
      ...activity,
      id: `act-${Date.now()}`,
      name: `${activity.name} (Copia)`,
      completed: false,
    };
    handleSaveActivity(duplicated);
  };

  // Toggle Completed
  const handleToggleComplete = (activityId: string) => {
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

  // Move Order (Up/Down)
  const handleMoveOrder = (activityId: string, direction: 'up' | 'down') => {
    if (!currentDay) return;
    const activities = [...currentDay.activities];
    const index = activities.findIndex((a) => a.id === activityId);
    if (index === -1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= activities.length) return;

    // Swap
    const temp = activities[index];
    activities[index] = activities[targetIndex];
    activities[targetIndex] = temp;

    const updatedDays = trip.days.map((day) =>
      day.id === currentDay.id ? { ...day, activities } : day
    );
    onUpdateTrip({ ...trip, days: updatedDays });
  };

  // Move to another Day
  const handleMoveToDay = (activityId: string, targetDayId: string) => {
    let movedAct: Activity | null = null;

    // 1. Remove from source
    const withoutActDays = trip.days.map((day) => {
      const found = day.activities.find((a) => a.id === activityId);
      if (found) {
        movedAct = { ...found, dayId: targetDayId };
        return {
          ...day,
          activities: day.activities.filter((a) => a.id !== activityId),
        };
      }
      return day;
    });

    if (!movedAct) return;

    // 2. Add to target
    const finalDays = withoutActDays.map((day) => {
      if (day.id === targetDayId && movedAct) {
        const newActivities = [...day.activities, movedAct].sort((a, b) =>
          a.startTime.localeCompare(b.startTime)
        );
        return { ...day, activities: newActivities };
      }
      return day;
    });

    onUpdateTrip({ ...trip, days: finalDays });
    setMovingActivityId(null);
  };

  // Open Optimizer
  const handleRunOptimizer = () => {
    const report = ItineraryOptimizer.generateReport(trip.days);
    setOptimizerReport(report);
    setIsOptimizerOpen(true);
  };

  // Apply Optimization to current day
  const handleApplyOptimization = () => {
    if (!currentDay) return;
    const optimizedList = ItineraryOptimizer.reorderActivitiesByProximity(currentDay.activities);
    const updatedDays = trip.days.map((day) =>
      day.id === currentDay.id ? { ...day, activities: optimizedList } : day
    );
    onUpdateTrip({ ...trip, days: updatedDays });
  };

  return (
    <div className="space-y-6 pb-24 md:pb-12">
      {/* Trip Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#111918] border border-stone-200 dark:border-stone-800 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-stone-500 dark:text-stone-400">
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold uppercase tracking-wider">
                {trip.country}
              </span>
              <span aria-hidden="true">·</span>
              <span>{trip.totalDays} días ({trip.totalNights} noches)</span>
              <span aria-hidden="true">·</span>
              <span>{trip.travelers.adults + trip.travelers.children} viajeros</span>
              <span aria-hidden="true">·</span>
              <span className="capitalize">Ritmo {trip.pace}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100 font-serif tracking-tight">
              {trip.name}
            </h1>

            <p className="text-sm text-stone-600 dark:text-stone-300 line-clamp-2">
              {trip.summary || trip.destination}
            </p>
          </div>

          {/* Quick action buttons */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={handleRunOptimizer}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-stone-800 dark:text-stone-200 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 transition-colors"
            >
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Optimizar</span>
            </button>

            <button
              type="button"
              onClick={onOpenMap}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-stone-800 dark:text-stone-200 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 transition-colors"
            >
              <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Ver en Mapa</span>
            </button>

            <button
              type="button"
              onClick={onOpenTravelMode}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 transition-all shadow-sm"
            >
              <Navigation className="w-4 h-4" />
              <span>Modo Viaje</span>
            </button>
          </div>
        </div>
      </div>

      {/* Day Selector Carousel / Horizontal bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {trip.days.map((day, idx) => {
          const isSelected = selectedDayIndex === idx;
          const actsCount = day.activities.length;
          return (
            <button
              key={day.id}
              onClick={() => setSelectedDayIndex(idx)}
              className={`flex-shrink-0 px-4 py-2.5 rounded-2xl border text-left transition-all ${
                isSelected
                  ? 'bg-emerald-700 text-white border-emerald-700 shadow-md shadow-emerald-700/20'
                  : 'bg-white dark:bg-[#111918] border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:border-emerald-500/50'
              }`}
            >
              <span className={`block text-[11px] font-semibold uppercase tracking-wider ${isSelected ? 'text-emerald-200' : 'text-stone-400'}`}>
                Día {day.dayNumber}
              </span>
              <span className="block text-sm font-bold truncate max-w-[120px] font-serif">
                {day.city}
              </span>
              <span className={`block text-[10px] mt-0.5 ${isSelected ? 'text-emerald-100' : 'text-stone-400'}`}>
                {actsCount} actividades
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Day Card */}
      {currentDay && (
        <div className="space-y-4">
          {/* Day Title & Summary */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-stone-100/70 dark:bg-stone-900/40 border border-stone-200/80 dark:border-stone-800">
            <div>
              <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                  {currentDay.date}
                </span>
                <span>·</span>
                <span>{currentDay.city}</span>
              </div>
              <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 font-serif">
                {currentDay.theme || `Jornada en ${currentDay.city}`}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right text-xs">
                <span className="text-stone-500 dark:text-stone-400 block">Presupuesto del día</span>
                <span className="font-bold text-stone-900 dark:text-stone-100 font-mono text-sm">
                  {trip.currency}{dayTotalCost}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActivityToEdit(null);
                  setIsActivityModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar actividad</span>
              </button>
            </div>
          </div>

          {/* Activities List */}
          {dayActivities.length === 0 ? (
            <div className="text-center py-12 p-6 rounded-3xl bg-white dark:bg-[#111918] border border-dashed border-stone-300 dark:border-stone-800 space-y-3">
              <Compass className="w-10 h-10 text-stone-400 mx-auto" />
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 font-serif">
                No hay actividades programadas para este día
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
                Agrega visitas, paseos gastronómicos o momentos de descanso para estructurar la jornada.
              </p>
              <button
                type="button"
                onClick={() => {
                  setActivityToEdit(null);
                  setIsActivityModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar la primera actividad</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {dayActivities.map((act, index) => (
                <ActivityCard
                  key={act.id}
                  activity={act}
                  index={index}
                  totalActivities={dayActivities.length}
                  currency={trip.currency}
                  onSelect={(activity) => setDetailActivity(activity)}
                  onEdit={(activity) => {
                    setActivityToEdit(activity);
                    setIsActivityModalOpen(true);
                  }}
                  onDelete={handleDeleteActivity}
                  onDuplicate={handleDuplicateActivity}
                  onToggleComplete={handleToggleComplete}
                  onMoveOrder={handleMoveOrder}
                  onMoveToDay={(actId) => setMovingActivityId(actId)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Move Activity to Another Day Modal */}
      {movingActivityId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111918] rounded-2xl p-6 max-w-md w-full border border-stone-200 dark:border-stone-800 space-y-4">
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 font-serif">
              Mover actividad a otro día
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Seleccioná el día al que deseas trasladar esta actividad:
            </p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {trip.days.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => handleMoveToDay(movingActivityId, d.id)}
                  className="w-full text-left p-3 rounded-xl border border-stone-200 dark:border-stone-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:border-emerald-500/50 transition-all flex items-center justify-between text-xs"
                >
                  <span className="font-semibold text-stone-900 dark:text-stone-100">
                    Día {d.dayNumber} · {d.city}
                  </span>
                  <span className="text-stone-400 font-mono">{d.date}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setMovingActivityId(null)}
              className="w-full py-2 rounded-xl text-xs font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      <ActivityModal
        isOpen={isActivityModalOpen}
        onClose={() => {
          setIsActivityModalOpen(false);
          setActivityToEdit(null);
        }}
        dayId={currentDay?.id || ''}
        activityToEdit={activityToEdit}
        onSave={handleSaveActivity}
        currency={trip.currency}
      />

      {/* Detail Modal */}
      <ActivityDetailModal
        activity={detailActivity}
        onClose={() => setDetailActivity(null)}
        onEdit={(act) => {
          setActivityToEdit(act);
          setIsActivityModalOpen(true);
        }}
        onToggleComplete={handleToggleComplete}
        currency={trip.currency}
      />

      {/* Optimizer Report Modal */}
      <OptimizerReportModal
        isOpen={isOptimizerOpen}
        onClose={() => setIsOptimizerOpen(false)}
        report={optimizerReport}
        onApplyOptimization={handleApplyOptimization}
      />
    </div>
  );
};
