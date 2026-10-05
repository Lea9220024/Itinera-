import React from 'react';
import {
  X,
  Clock,
  MapPin,
  DollarSign,
  Tag,
  Share2,
  Edit2,
  CheckCircle2,
  Navigation,
  FileText,
  Star,
} from 'lucide-react';
import { Activity } from '../../types';
import { MapService } from '../../services/MapService';

interface ActivityDetailModalProps {
  activity: Activity | null;
  onClose: () => void;
  onEdit: (activity: Activity) => void;
  onToggleComplete: (activityId: string) => void;
  currency: string;
}

export const ActivityDetailModal: React.FC<ActivityDetailModalProps> = ({
  activity,
  onClose,
  onEdit,
  onToggleComplete,
  currency,
}) => {
  if (!activity) return null;

  const theme = MapService.getCategoryTheme(activity.category);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: activity.name,
        text: `${activity.name} (${activity.startTime} - ${activity.endTime}) en ${activity.location}`,
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(
        `${activity.name} - ${activity.startTime} a ${activity.endTime} en ${activity.location}`
      );
      alert('Información de la actividad copiada al portapapeles');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#111918] rounded-2xl sm:rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col">
        {/* Category Header Strip */}
        <div
          className="h-3 w-full"
          style={{ backgroundColor: theme.color }}
        />

        {/* Content Header */}
        <div className="flex items-start justify-between p-6 pb-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-medium text-stone-500 dark:text-stone-400">
              <span style={{ color: theme.color }} className="font-semibold">
                {theme.label}
              </span>
              <span>·</span>
              <span>{activity.durationMinutes} min</span>
              {activity.completed && (
                <>
                  <span>·</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Realizada
                  </span>
                </>
              )}
            </div>
            <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100 font-serif leading-tight">
              {activity.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 pt-2 space-y-4 overflow-y-auto max-h-[75vh]">
          {/* Times & Distance Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800">
              <span className="text-[11px] text-stone-500 dark:text-stone-400 block font-medium">Horario</span>
              <span className="text-sm font-bold text-stone-900 dark:text-stone-100 font-mono">
                {activity.startTime} — {activity.endTime}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800">
              <span className="text-[11px] text-stone-500 dark:text-stone-400 block font-medium">Costo estimado</span>
              <span className="text-sm font-bold text-stone-900 dark:text-stone-100 font-mono">
                {currency}{activity.estimatedCost}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800 col-span-2 sm:col-span-1">
              <span className="text-[11px] text-stone-500 dark:text-stone-400 block font-medium">Distancia previa</span>
              <span className="text-sm font-bold text-stone-900 dark:text-stone-100 font-mono">
                {activity.distanceFromPreviousKm ? `${activity.distanceFromPreviousKm} km` : 'Punto inicial'}
              </span>
            </div>
          </div>

          {/* Description */}
          {activity.description && (
            <div>
              <span className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                Descripción
              </span>
              <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                {activity.description}
              </p>
            </div>
          )}

          {/* Location */}
          <div className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/30 flex items-start gap-3">
            <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-semibold text-stone-900 dark:text-stone-100 block">
                Ubicación
              </span>
              <span className="text-xs text-stone-600 dark:text-stone-400">
                {activity.location}
              </span>
            </div>
          </div>

          {/* Notes */}
          {activity.notes && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 space-y-1">
              <span className="text-xs font-semibold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Notas personales
              </span>
              <p className="text-xs text-amber-800 dark:text-amber-200/90 leading-relaxed">
                {activity.notes}
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-6 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between gap-2 bg-stone-50/70 dark:bg-stone-900/40">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              title="Compartir actividad"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                onToggleComplete(activity.id);
                onClose();
              }}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activity.completed
                  ? 'bg-stone-200 dark:bg-stone-700 text-stone-800 dark:text-stone-200'
                  : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{activity.completed ? 'Desmarcar' : 'Marcar realizada'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              onEdit(activity);
              onClose();
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 transition-all shadow-sm"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Editar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
