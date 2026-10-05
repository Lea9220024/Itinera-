import React, { useState } from 'react';
import { CloudUpload, Check, AlertCircle, X, ArrowRight } from 'lucide-react';
import { MigrationService } from '../../services/MigrationService';

interface MigrationBannerProps {
  localTripCount: number;
  onMigrationComplete: () => void;
}

export const MigrationBanner: React.FC<MigrationBannerProps> = ({
  localTripCount,
  onMigrationComplete,
}) => {
  const [migrating, setMigrating] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  if (dismissed || localTripCount === 0) return null;

  const handleMigrate = async () => {
    setMigrating(true);
    setResult(null);

    const res = await MigrationService.migrateLocalDataToSupabase();
    setMigrating(false);

    if (res.success) {
      setResult({
        success: true,
        message: `¡${res.migratedCount} viajes sincronizados con éxito en tu cuenta de Supabase!`,
      });
      setTimeout(() => {
        onMigrationComplete();
        setDismissed(true);
      }, 1500);
    } else {
      setResult({
        success: false,
        message: res.error || 'No se pudo completar la migración.',
      });
    }
  };

  return (
    <div className="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 mt-0.5">
          <CloudUpload className="w-5 h-5" />
        </div>
        <div>
          <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 block">
            Datos locales detectados ({localTripCount} {localTripCount === 1 ? 'viaje' : 'viajes'})
          </span>
          <p className="text-xs text-emerald-800/90 dark:text-emerald-300/90 mt-0.5">
            Puedes sincronizar tus itinerarios y presupuestos creados en este navegador con tu cuenta en la nube.
          </p>

          {result && (
            <p
              className={`text-xs font-semibold mt-1 flex items-center gap-1 ${
                result.success ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {result.success ? <Check className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
              <span>{result.message}</span>
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="px-3 py-1.5 rounded-xl text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-200/50"
        >
          Mantener local
        </button>

        <button
          type="button"
          disabled={migrating}
          onClick={handleMigrate}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 shadow-xs transition-all disabled:opacity-50"
        >
          <span>{migrating ? 'Sincronizando...' : 'Sincronizar a Supabase'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
