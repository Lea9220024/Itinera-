import React, { useState, useEffect } from 'react';
import { User, Sliders, Moon, Sun, RotateCcw, Check, Sparkles, Globe } from 'lucide-react';
import { UserPreferences } from '../../types';
import { StorageService } from '../../services/StorageService';

interface ProfileViewProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onResetDemo: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  darkMode,
  onToggleDarkMode,
  onResetDemo,
}) => {
  const [prefs, setPrefs] = useState<UserPreferences>({
    gastronomy: 8,
    nature: 7,
    history: 9,
    relax: 6,
    adventure: 5,
    culture: 8,
    preferredCurrency: '€',
    language: 'es',
  });
  const [savedFeedback, setSavedFeedback] = useState(false);

  useEffect(() => {
    StorageService.getUserPreferences().then((p) => {
      if (p) setPrefs(p);
    });
  }, []);

  const handleUpdatePref = (key: keyof UserPreferences, value: number | string) => {
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    StorageService.saveUserPreferences(updated);
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 1500);
  };

  const styleSliders: { key: keyof UserPreferences; label: string; desc: string }[] = [
    { key: 'gastronomy', label: 'Gastronomía y Enología', desc: 'Restaurantes típicos, catas y cafés históricos' },
    { key: 'history', label: 'Historia y Patrimonio', desc: 'Ruinas, monumentos arqueológicos y museos' },
    { key: 'culture', label: 'Arte y Arquitectura', desc: 'Galerías, iglesias renacentistas y diseño' },
    { key: 'nature', label: 'Naturaleza y Paisajes', desc: 'Parques, miradores, costas y senderismo' },
    { key: 'relax', label: 'Relax y Tiempo Libre', desc: 'Paseos sin prisa, terrazas y pausas relajantes' },
    { key: 'adventure', label: 'Aventura y Deporte', desc: 'Rutas activas, barco y actividades al aire libre' },
  ];

  return (
    <div className="space-y-6 pb-24 md:pb-12 max-w-2xl mx-auto">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#111918] border border-stone-200 dark:border-stone-800 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-bold text-xl font-serif shadow-sm">
            IT
          </div>
          <div>
            <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100 font-serif">
              Perfil de Viajero
            </h2>
            <span className="text-xs text-stone-500 dark:text-stone-400">
              Preferencias calibradas para el motor de itinerarios
            </span>
          </div>
        </div>

        {savedFeedback && (
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <Check className="w-3.5 h-3.5" /> Guardado
          </span>
        )}
      </div>

      {/* Travel Style Sliders */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#111918] border border-stone-200 dark:border-stone-800 shadow-sm space-y-6">
        <div>
          <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 font-serif">
            Mi Estilo de Viaje
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Ajusta los controles para influir en las propuestas del generador de itinerarios y del asistente de IA.
          </p>
        </div>

        <div className="space-y-5">
          {styleSliders.map((slider) => {
            const val = Number(prefs[slider.key]) || 5;
            return (
              <div key={slider.key} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-stone-800 dark:text-stone-200">
                      {slider.label}
                    </span>
                    <span className="text-[11px] text-stone-400 block">{slider.desc}</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                    {val}/10
                  </span>
                </div>

                {/* Range Slider */}
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={val}
                  onChange={(e) => handleUpdatePref(slider.key, Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* App & Currency Preferences */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#111918] border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 font-serif">
          Configuración General
        </h3>

        <div className="divide-y divide-stone-100 dark:divide-stone-800 text-xs">
          {/* Currency */}
          <div className="py-3 flex items-center justify-between">
            <div>
              <span className="font-semibold text-stone-800 dark:text-stone-200 block">
                Moneda predeterminada
              </span>
              <span className="text-stone-400 text-[11px]">
                Utilizada para presupuestos y costes estimados
              </span>
            </div>
            <select
              value={prefs.preferredCurrency}
              onChange={(e) => handleUpdatePref('preferredCurrency', e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-800 dark:text-stone-200 font-mono focus:outline-none"
            >
              <option value="€">EUR (€)</option>
              <option value="$">USD ($)</option>
              <option value="£">GBP (£)</option>
              <option value="ARS$">ARS ($)</option>
            </select>
          </div>

          {/* Dark Mode */}
          <div className="py-3 flex items-center justify-between">
            <div>
              <span className="font-semibold text-stone-800 dark:text-stone-200 block">
                Tema de la aplicación
              </span>
              <span className="text-stone-400 text-[11px]">
                {darkMode ? 'Modo oscuro activado' : 'Modo claro activado'}
              </span>
            </div>
            <button
              type="button"
              onClick={onToggleDarkMode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
            >
              {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
              <span>{darkMode ? 'Claro' : 'Oscuro'}</span>
            </button>
          </div>

          {/* Reset Demo Data */}
          <div className="py-3 flex items-center justify-between">
            <div>
              <span className="font-semibold text-stone-800 dark:text-stone-200 block">
                Restablecer viaje demo
              </span>
              <span className="text-stone-400 text-[11px]">
                Restaura "Escapada a Italia" (8 días, Roma, Florencia, Venecia, Milán)
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                if (confirm('¿Restablecer datos demo del viaje a Italia?')) {
                  onResetDemo();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-stone-600 dark:text-stone-400 hover:text-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
