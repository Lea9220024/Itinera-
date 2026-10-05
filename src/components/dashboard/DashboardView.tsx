import React from 'react';
import {
  Calendar,
  MapPin,
  Users,
  Wallet,
  ArrowRight,
  Plus,
  Compass,
  Sparkles,
  Plane,
  Navigation,
  Globe2,
  CheckCircle2,
} from 'lucide-react';
import { Trip } from '../../types';

interface DashboardViewProps {
  activeTrip: Trip | null;
  trips: Trip[];
  onOpenTrip: (tripId: string) => void;
  onOpenWizard: () => void;
  onOpenTravelMode: () => void;
  onOpenAI: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  activeTrip,
  trips,
  onOpenTrip,
  onOpenWizard,
  onOpenTravelMode,
  onOpenAI,
}) => {
  // Aggregate stats
  const totalTrips = trips.length;
  const allCountries = Array.from(new Set(trips.map((t) => t.country).filter(Boolean)));
  const allCities = Array.from(
    new Set(trips.flatMap((t) => t.destinationsList || []).filter(Boolean))
  );
  const totalDays = trips.reduce((acc, t) => acc + (t.totalDays || 0), 0);

  // Group trips
  const upcomingTrips = trips.filter((t) => t.status === 'upcoming' || t.status === 'ongoing');
  const planningTrips = trips.filter((t) => t.status === 'planning');
  const completedTrips = trips.filter((t) => t.status === 'completed');

  return (
    <div className="space-y-8 pb-24 md:pb-12">
      {/* 1. HERO BANNER: Próximo Viaje Destacado */}
      {activeTrip && (
        <div className="relative rounded-3xl overflow-hidden bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xl group">
          {/* Hero Background Image */}
          <div className="absolute inset-0">
            <img
              src={activeTrip.coverImage || '/src/assets/images/hero_italy_amalfi_1791169026085.jpg'}
              alt={activeTrip.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700 ease-out"
            />
            {/* Scrim Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30" />
          </div>

          {/* Hero Content */}
          <div className="relative z-10 p-6 sm:p-10 lg:p-12 flex flex-col justify-between min-h-[380px] sm:min-h-[440px] text-white">
            {/* Top kicker */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-emerald-600/90 backdrop-blur-md text-[11px] font-bold tracking-wider uppercase">
                  {activeTrip.status === 'ongoing' ? '● En curso ahora' : 'Próxima aventura'}
                </span>
                <span className="text-xs text-stone-300 font-medium">
                  {activeTrip.country}
                </span>
              </div>

              <button
                type="button"
                onClick={onOpenAI}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-xs font-medium text-white transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                <span>Consultar con IA</span>
              </button>
            </div>

            {/* Middle Main Text */}
            <div className="space-y-3 max-w-2xl my-auto py-6">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-serif tracking-tight leading-tight text-white">
                {activeTrip.name}
              </h1>

              <p className="text-sm sm:text-base text-stone-200 line-clamp-2 leading-relaxed">
                {activeTrip.summary || activeTrip.destination}
              </p>

              {/* Badges metadata (clean text with dots) */}
              <div className="flex flex-wrap items-center gap-2.5 text-xs text-stone-300 pt-1">
                <span className="font-semibold text-emerald-300">
                  {activeTrip.totalDays} DÍAS ({activeTrip.totalNights} NOCHES)
                </span>
                <span aria-hidden="true">·</span>
                <span>{activeTrip.startDate} — {activeTrip.endDate}</span>
                <span aria-hidden="true">·</span>
                <span>{activeTrip.travelers.adults + activeTrip.travelers.children} VIAJEROS</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono">{activeTrip.currency}{activeTrip.budgetTotal}</span>
              </div>
            </div>

            {/* Bottom Action Bar */}
            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => onOpenTrip(activeTrip.id)}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold text-stone-900 bg-white hover:bg-stone-100 transition-all shadow-lg active:scale-98"
              >
                <span>Continuar planificación</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onOpenTravelMode}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-semibold text-white bg-emerald-600/80 hover:bg-emerald-600 backdrop-blur-md transition-all shadow-lg active:scale-98"
              >
                <Navigation className="w-4 h-4" />
                <span>Activar Modo Viaje</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. STATS BENTO GRID (Resumen del Viajero) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 font-serif">
            Estadísticas y Resumen
          </h2>
          <span className="text-xs text-stone-500">Pasaporte digital</span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-3xl bg-white dark:bg-[#111918] border border-stone-200 dark:border-stone-800 shadow-sm space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 block">
              Viajes organizados
            </span>
            <div className="text-3xl font-extrabold text-stone-900 dark:text-stone-100 font-mono">
              {totalTrips}
            </div>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 block">
              {upcomingTrips.length} activos o próximos
            </span>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-[#111918] border border-stone-200 dark:border-stone-800 shadow-sm space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 block">
              Países explorados
            </span>
            <div className="text-3xl font-extrabold text-stone-900 dark:text-stone-100 font-mono">
              {allCountries.length}
            </div>
            <span className="text-xs text-stone-500 truncate block">
              {allCountries.join(', ') || 'Sin destinos'}
            </span>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-[#111918] border border-stone-200 dark:border-stone-800 shadow-sm space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 block">
              Ciudades en ruta
            </span>
            <div className="text-3xl font-extrabold text-stone-900 dark:text-stone-100 font-mono">
              {allCities.length}
            </div>
            <span className="text-xs text-stone-500 truncate block">
              {allCities.slice(0, 3).join(', ')}
            </span>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-[#111918] border border-stone-200 dark:border-stone-800 shadow-sm space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 block">
              Días de aventura
            </span>
            <div className="text-3xl font-extrabold text-stone-900 dark:text-stone-100 font-mono">
              {totalDays}
            </div>
            <span className="text-xs text-stone-500 block">Itinerarios optimizados</span>
          </div>
        </div>
      </div>

      {/* 3. MIS VIAJES (Upcoming & Planning Quick Cards) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 font-serif">
              Mis Viajes
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Tus itinerarios activos, en diseño o completados
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenWizard}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Crear nuevo viaje</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {trips.map((trip) => (
            <div
              key={trip.id}
              onClick={() => onOpenTrip(trip.id)}
              className="group cursor-pointer rounded-3xl bg-white dark:bg-[#111918] border border-stone-200 dark:border-stone-800 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
            >
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                    {trip.country}
                  </span>
                  <span>{trip.totalDays} días</span>
                </div>

                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 font-serif group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                  {trip.name}
                </h3>

                <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2">
                  {trip.summary || trip.destination}
                </p>
              </div>

              <div className="px-5 py-3.5 bg-stone-50/80 dark:bg-stone-900/50 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between text-xs text-stone-600 dark:text-stone-300">
                <span className="font-mono font-bold text-stone-900 dark:text-stone-100">
                  {trip.currency}{trip.budgetTotal}
                </span>
                <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold group-hover:translate-x-1 transition-transform">
                  Ver itinerario <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
