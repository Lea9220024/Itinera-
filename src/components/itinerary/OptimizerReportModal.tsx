import React from 'react';
import { X, Sparkles, CheckCircle, AlertTriangle, ArrowRight, Compass, Lightbulb } from 'lucide-react';
import { TripOptimizationReport, DayOptimizationResult } from '../../services/ItineraryOptimizer';

interface OptimizerReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: TripOptimizationReport | null;
  onApplyOptimization: () => void;
}

export const OptimizerReportModal: React.FC<OptimizerReportModalProps> = ({
  isOpen,
  onClose,
  report,
  onApplyOptimization,
}) => {
  if (!isOpen || !report) return null;

  const { scores } = report;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-white dark:bg-[#111918] rounded-2xl sm:rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-stone-800 bg-emerald-50/50 dark:bg-emerald-950/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 font-serif">
                Diagnóstico de ItineraryOptimizer
              </h3>
              <span className="text-xs text-stone-500 dark:text-stone-400">
                Análisis geoespacial, temporal y presupuestario
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Main Score & Explanatory Sub-scores */}
          <div className="p-5 rounded-2xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-stone-500 dark:text-stone-400 uppercase font-semibold tracking-wider">
                  Score General
                </span>
                <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 mt-0.5 max-w-sm">
                  {report.summary}
                </p>
              </div>
              <div className="text-right">
                <span
                  className={`text-3xl sm:text-4xl font-extrabold font-mono ${
                    scores.overall >= 80
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : scores.overall >= 65
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {scores.overall}/100
                </span>
              </div>
            </div>

            {/* Sub-Scores Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-stone-200/80 dark:border-stone-800">
              <div className="p-2.5 rounded-xl bg-white dark:bg-stone-800/80 border border-stone-200/60 dark:border-stone-700/60 text-center">
                <span className="text-[10px] text-stone-500 dark:text-stone-400 block font-medium">Logística</span>
                <span className="text-sm font-bold font-mono text-stone-900 dark:text-stone-100">{scores.logistics}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-stone-800/80 border border-stone-200/60 dark:border-stone-700/60 text-center">
                <span className="text-[10px] text-stone-500 dark:text-stone-400 block font-medium">Ritmo</span>
                <span className="text-sm font-bold font-mono text-stone-900 dark:text-stone-100">{scores.pacing}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-stone-800/80 border border-stone-200/60 dark:border-stone-700/60 text-center">
                <span className="text-[10px] text-stone-500 dark:text-stone-400 block font-medium">Presupuesto</span>
                <span className="text-sm font-bold font-mono text-stone-900 dark:text-stone-100">{scores.budget}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-stone-800/80 border border-stone-200/60 dark:border-stone-700/60 text-center">
                <span className="text-[10px] text-stone-500 dark:text-stone-400 block font-medium">Distribución</span>
                <span className="text-sm font-bold font-mono text-stone-900 dark:text-stone-100">{scores.distribution}</span>
              </div>
            </div>
          </div>

          {/* Suggestions if any */}
          {report.suggestions.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                <span>Recomendaciones del Motor</span>
              </h4>
              <div className="space-y-2">
                {report.suggestions.map((s) => (
                  <div
                    key={s.id}
                    className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200"
                  >
                    <span className="font-bold block mb-0.5">{s.title}</span>
                    <span className="text-stone-600 dark:text-stone-400">{s.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Days breakdown */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
              Análisis detallado por jornadas
            </h4>

            {report.daysAnalysis.map((day) => (
              <div
                key={day.dayId}
                className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/40 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between font-medium">
                  <span className="font-bold text-stone-900 dark:text-stone-100">
                    Día {day.dayNumber} · {day.city}
                  </span>
                  <div className="flex items-center gap-2 text-stone-500 font-mono">
                    <span>{day.totalDistanceKm} km acum.</span>
                    <span>·</span>
                    <span>{Math.round(day.totalDurationMinutes / 60)}h activas</span>
                  </div>
                </div>

                {day.issues.length > 0 ? (
                  <div className="space-y-1 pt-1">
                    {day.issues.map((issue, idx) => (
                      <div
                        key={idx}
                        className={`flex items-start gap-1.5 p-2 rounded-lg ${
                          issue.severity === 'warning'
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300'
                            : 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300'
                        }`}
                      >
                        <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                        <span>{issue.message}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 pt-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Recorrido geográficamente armónico sin fricciones.</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50 dark:bg-stone-900/40">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={() => {
              onApplyOptimization();
              onClose();
            }}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 transition-all shadow-sm"
          >
            <span>Reordenar por proximidad</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
