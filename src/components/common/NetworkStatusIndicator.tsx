import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

export const NetworkStatusIndicator: React.FC = () => {
  const isOnline = useNetworkStatus();

  if (isOnline) {
    return (
      <div
        className="hidden lg:flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800"
        title="Conexión en línea activa"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span>ONLINE</span>
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 shadow-xs"
      title="Modo offline: visualizando datos en caché local"
    >
      <WifiOff className="w-3 h-3 text-amber-600 dark:text-amber-400" />
      <span>MODO OFFLINE</span>
    </div>
  );
};
