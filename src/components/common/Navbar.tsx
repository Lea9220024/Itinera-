import React from 'react';
import { Compass, Moon, Sun, Sparkles, Plus, Plane, User, LogOut } from 'lucide-react';
import { Trip } from '../../types';
import { NetworkStatusIndicator } from './NetworkStatusIndicator';
import { useAuth } from '../../contexts/AuthContext';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  activeTrip: Trip | null;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenAIChat: () => void;
  onOpenWizard: () => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  darkMode,
  onToggleDarkMode,
  onOpenAIChat,
  onOpenWizard,
  onOpenAuth,
}) => {
  const { user, signOut, isConfigured } = useAuth();

  const navLinks = [
    { id: 'dashboard', label: 'Inicio' },
    { id: 'trips', label: 'Mis Viajes' },
    { id: 'itinerary', label: 'Itinerario' },
    { id: 'map', label: 'Mapa' },
    { id: 'budget', label: 'Presupuesto' },
    { id: 'travel-mode', label: 'Modo Viaje' },
    { id: 'checklist', label: 'Checklist' },
    { id: 'memories', label: 'Recuerdos' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-[#0e1615]/95 backdrop-blur-md border-b border-stone-200/80 dark:border-stone-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark */}
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2.5 text-left group focus:outline-none"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-sm group-hover:bg-emerald-600 transition-colors">
            <Compass className="w-5 h-5 transition-transform duration-300 group-hover:rotate-45" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-50 font-serif">
              Itinera
            </span>
          </div>
        </button>

        {/* Zone 2: 4-6 clean text navigation links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {navLinks.slice(0, 6).map((link) => {
            const isActive = currentView === link.id;
            return (
              <button
                key={link.id}
                onClick={() => onNavigate(link.id)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                  isActive
                    ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 font-semibold'
                    : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800/60'
                }`}
              >
                {link.label}
              </button>
            );
          })}
          {/* More dropdown or secondary link */}
          <button
            onClick={() => onNavigate('memories')}
            className={`hidden xl:inline-block px-3 py-1.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              currentView === 'memories'
                ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 font-semibold'
                : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800/60'
            }`}
          >
            Recuerdos
          </button>
        </nav>

        {/* Zone 3: Primary actions & toggles */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Online/Offline indicator */}
          <NetworkStatusIndicator />

          {/* User Auth indicator */}
          {user ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onNavigate('profile')}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-stone-700 dark:text-stone-200 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                title={`Conectado como ${user.email}`}
              >
                <div className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[10px]">
                  {user.name?.slice(0, 1).toUpperCase() || 'U'}
                </div>
                <span className="hidden sm:inline truncate max-w-[90px]">{user.name || user.email.split('@')[0]}</span>
              </button>
              <button
                type="button"
                onClick={() => signOut()}
                className="p-1.5 text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700 transition-colors"
            >
              <User className="w-3.5 h-3.5 text-stone-500" />
              <span className="hidden sm:inline">Cuenta</span>
            </button>
          )}

          {/* Dark mode button */}
          <button
            type="button"
            onClick={onToggleDarkMode}
            title={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            aria-label="Alternar tema de color"
            className="w-9 h-9 flex items-center justify-center rounded-lg text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* AI Assistant button */}
          <button
            type="button"
            onClick={onOpenAIChat}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg text-emerald-800 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-900/40 hover:bg-emerald-200/70 dark:hover:bg-emerald-900/70 transition-colors border border-emerald-300/40 dark:border-emerald-700/50 whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Asistente IA</span>
          </button>

          {/* New Trip CTA */}
          <button
            type="button"
            onClick={onOpenWizard}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-lg text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 shadow-sm transition-all whitespace-nowrap active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nuevo Viaje</span>
            <span className="sm:hidden">Crear</span>
          </button>
        </div>
      </div>
    </header>
  );
};

