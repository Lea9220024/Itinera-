import React from 'react';
import { Home, Calendar, MapPin, Navigation, MoreHorizontal } from 'lucide-react';

interface MobileBottomNavProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenMoreMenu: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  onNavigate,
  onOpenMoreMenu,
}) => {
  const tabs = [
    { id: 'dashboard', label: 'Inicio', icon: Home },
    { id: 'itinerary', label: 'Itinerario', icon: Calendar },
    { id: 'map', label: 'Mapa', icon: MapPin },
    { id: 'travel-mode', label: 'Modo Viaje', icon: Navigation },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0e1615]/95 backdrop-blur-md border-t border-stone-200 dark:border-stone-800 pb-[env(safe-area-inset-bottom)] transition-colors">
      <div className="grid grid-cols-5 items-center h-16 max-w-md mx-auto px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentView === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id)}
              className={`flex flex-col items-center justify-center min-h-[48px] py-1 transition-colors ${
                isActive
                  ? 'text-emerald-700 dark:text-emerald-400 font-medium'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className="text-[10px] tracking-tight mt-1 truncate">{tab.label}</span>
            </button>
          );
        })}

        {/* More Tab */}
        <button
          onClick={onOpenMoreMenu}
          className={`flex flex-col items-center justify-center min-h-[48px] py-1 transition-colors ${
            ['budget', 'checklist', 'memories', 'profile', 'trips'].includes(currentView)
              ? 'text-emerald-700 dark:text-emerald-400 font-medium'
              : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          <MoreHorizontal className="w-5 h-5 stroke-2" />
          <span className="text-[10px] tracking-tight mt-1 truncate">Más</span>
        </button>
      </div>
    </nav>
  );
};
