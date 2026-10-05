import React from 'react';
import { X, Wallet, CheckSquare, Camera, User, Compass, MapPin, Sparkles } from 'lucide-react';

interface MoreMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string) => void;
  onOpenAI: () => void;
  onOpenWizard: () => void;
}

export const MoreMenuModal: React.FC<MoreMenuModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenAI,
  onOpenWizard,
}) => {
  if (!isOpen) return null;

  const items = [
    { id: 'trips', label: 'Mis Viajes', desc: 'Ver todos tus itinerarios', icon: Compass },
    { id: 'budget', label: 'Presupuesto', desc: 'Control de gastos y saldos', icon: Wallet },
    { id: 'checklist', label: 'Checklist', desc: 'Equipaje, pasaportes y tareas', icon: CheckSquare },
    { id: 'memories', label: 'Recuerdos', desc: 'Diario y fotos de viaje', icon: Camera },
    { id: 'profile', label: 'Perfil y Estilo', desc: 'Preferencias y calibración', icon: User },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end justify-center animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white dark:bg-[#111918] rounded-t-3xl border-t border-stone-200 dark:border-stone-800 p-6 space-y-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] animate-in slide-in-from-bottom duration-200">
        {/* Grab Handle */}
        <div className="w-12 h-1 bg-stone-300 dark:bg-stone-700 rounded-full mx-auto" />

        <div className="flex items-center justify-between pb-2">
          <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 font-serif">
            Secciones y Herramientas
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onNavigate(item.id);
                  onClose();
                }}
                className="w-full p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-900/60 flex items-center gap-3 text-left transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-sm font-bold text-stone-900 dark:text-stone-100">
                    {item.label}
                  </span>
                  <span className="block text-xs text-stone-500 dark:text-stone-400">
                    {item.desc}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex gap-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenAI();
            }}
            className="flex-1 py-3 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold text-xs flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Asistente IA</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenWizard();
            }}
            className="flex-1 py-3 rounded-xl bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs"
          >
            <span>+ Nuevo Viaje</span>
          </button>
        </div>
      </div>
    </div>
  );
};
