import React from 'react';
import {
  Clock,
  MapPin,
  CheckCircle2,
  Circle,
  MoreVertical,
  ArrowUp,
  ArrowDown,
  Copy,
  Trash2,
  Edit2,
  Navigation2,
  FileText,
  Calendar,
} from 'lucide-react';
import { Activity } from '../../types';
import { MapService } from '../../services/MapService';

interface ActivityCardProps {
  activity: Activity;
  index: number;
  totalActivities: number;
  currency: string;
  onSelect: (activity: Activity) => void;
  onEdit: (activity: Activity) => void;
  onDelete: (activityId: string) => void;
  onDuplicate: (activity: Activity) => void;
  onToggleComplete: (activityId: string) => void;
  onMoveOrder: (activityId: string, direction: 'up' | 'down') => void;
  onMoveToDay?: (activityId: string) => void;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({
  activity,
  index,
  totalActivities,
  currency,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleComplete,
  onMoveOrder,
  onMoveToDay,
}) => {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const theme = MapService.getCategoryTheme(activity.category);

  return (
    <div
      className={`group relative rounded-2xl border transition-all duration-200 ${
        activity.completed
          ? 'bg-stone-50/60 dark:bg-stone-900/40 border-stone-200/60 dark:border-stone-800/60 opacity-80'
          : 'bg-white dark:bg-[#111918] border-stone-200 dark:border-stone-800 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 shadow-sm hover:shadow-md'
      }`}
    >
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Checkbox + Time + Content */}
        <div className="flex items-start gap-3.5 flex-1 min-w-0">
          {/* Complete Toggle Checkbox */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleComplete(activity.id);
            }}
            className="mt-1 text-stone-300 dark:text-stone-600 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors shrink-0"
            title={activity.completed ? 'Marcar como pendiente' : 'Marcar como completada'}
          >
            {activity.completed ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Circle className="w-5 h-5" />
            )}
          </button>

          {/* Body content */}
          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onSelect(activity)}>
            {/* Top row: Category text & Duration & Distance */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 dark:text-stone-400 mb-1">
              <span
                style={{ color: theme.color }}
                className="font-semibold"
              >
                {theme.label}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">{activity.startTime} – {activity.endTime}</span>
              <span aria-hidden="true">·</span>
              <span>{activity.durationMinutes} min</span>
              {activity.distanceFromPreviousKm && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                    +{activity.distanceFromPreviousKm} km
                  </span>
                </>
              )}
            </div>

            {/* Title */}
            <h4
              className={`text-base font-bold text-stone-900 dark:text-stone-100 font-serif leading-snug truncate ${
                activity.completed ? 'line-through text-stone-400 dark:text-stone-500' : ''
              }`}
            >
              {activity.name}
            </h4>

            {/* Location & notes preview */}
            <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 mt-1 truncate">
              <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              <span className="truncate">{activity.location}</span>
            </div>

            {activity.notes && (
              <div className="mt-2 text-xs text-stone-500 dark:text-stone-400 italic line-clamp-1">
                "{activity.notes}"
              </div>
            )}
          </div>
        </div>

        {/* Right: Cost & Quick Actions */}
        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100 dark:border-stone-800">
          <div className="text-right">
            <span className="text-xs text-stone-500 dark:text-stone-400 block sm:hidden">Costo</span>
            <span className="text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100 font-mono">
              {currency}{activity.estimatedCost}
            </span>
          </div>

          {/* Quick buttons & Menu */}
          <div className="flex items-center gap-1">
            {/* Move Up/Down */}
            <div className="hidden sm:flex items-center gap-0.5">
              <button
                type="button"
                disabled={index === 0}
                onClick={() => onMoveOrder(activity.id, 'up')}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 disabled:opacity-20 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                title="Subir orden"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                disabled={index === totalActivities - 1}
                onClick={() => onMoveOrder(activity.id, 'down')}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 disabled:opacity-20 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                title="Bajar orden"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Menu trigger */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 z-30 w-44 bg-white dark:bg-[#151f1e] rounded-xl shadow-lg border border-stone-200 dark:border-stone-700 py-1.5 text-xs animate-in fade-in-50 duration-100">
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onEdit(activity);
                      }}
                      className="w-full px-3 py-2 text-left text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center gap-2"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-stone-500" />
                      <span>Editar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onDuplicate(activity);
                      }}
                      className="w-full px-3 py-2 text-left text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center gap-2"
                    >
                      <Copy className="w-3.5 h-3.5 text-stone-500" />
                      <span>Duplicar</span>
                    </button>
                    {onMoveToDay && (
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          onMoveToDay(activity.id);
                        }}
                        className="w-full px-3 py-2 text-left text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center gap-2"
                      >
                        <Calendar className="w-3.5 h-3.5 text-stone-500" />
                        <span>Mover a otro día</span>
                      </button>
                    )}
                    <div className="my-1 border-t border-stone-100 dark:border-stone-800" />
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onDelete(activity.id);
                      }}
                      className="w-full px-3 py-2 text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                      <span>Eliminar</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
