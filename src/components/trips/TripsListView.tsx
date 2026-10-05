import React, { useState } from 'react';
import {
  Calendar,
  MapPin,
  Users,
  Wallet,
  Plus,
  Copy,
  Trash2,
  ArrowRight,
  Search,
  Filter,
} from 'lucide-react';
import { Trip, TripStatus } from '../../types';

interface TripsListViewProps {
  trips: Trip[];
  activeTripId: string | null;
  onSelectTrip: (tripId: string) => void;
  onDuplicateTrip: (tripId: string) => void;
  onDeleteTrip: (tripId: string) => void;
  onOpenWizard: () => void;
}

export const TripsListView: React.FC<TripsListViewProps> = ({
  trips,
  activeTripId,
  onSelectTrip,
  onDuplicateTrip,
  onDeleteTrip,
  onOpenWizard,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTrips = trips.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        t.name.toLowerCase().includes(term) ||
        t.destination.toLowerCase().includes(term) ||
        t.country.toLowerCase().includes(term)
      );
    }
    return true;
  });

  const getStatusText = (status: TripStatus) => {
    switch (status) {
      case 'ongoing':
        return 'En curso';
      case 'upcoming':
        return 'Próximo';
      case 'planning':
        return 'En planificación';
      case 'completed':
        return 'Completado';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6 pb-24 md:pb-12">
      {/* Top Banner & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-[#111918] border border-stone-200 dark:border-stone-800 shadow-sm">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            Tu Colección de Aventuras
          </span>
          <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100 font-serif">
            Mis Viajes
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            {trips.length} viajes registrados en tu pasaporte digital.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenWizard}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Crear nuevo viaje</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        {/* Status tabs */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'ongoing', label: 'En curso' },
            { id: 'planning', label: 'En planificación' },
            { id: 'completed', label: 'Completados' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === tab.id
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-white dark:bg-[#111918] border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por destino o nombre..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#111918] text-stone-900 dark:text-stone-100 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Trips Grid */}
      {filteredTrips.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-white dark:bg-[#111918] border border-dashed border-stone-300 dark:border-stone-800 space-y-3">
          <MapPin className="w-10 h-10 text-stone-400 mx-auto" />
          <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 font-serif">
            No se encontraron viajes con este filtro
          </h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Ajusta los términos de búsqueda o comienza un nuevo itinerario desde cero.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrips.map((trip) => {
            const isActive = activeTripId === trip.id;
            return (
              <div
                key={trip.id}
                className={`rounded-3xl bg-white dark:bg-[#111918] border overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col ${
                  isActive
                    ? 'border-emerald-600 ring-2 ring-emerald-600/30'
                    : 'border-stone-200 dark:border-stone-800'
                }`}
              >
                {/* Cover Image */}
                <div className="relative h-44 w-full bg-stone-200 dark:bg-stone-800 overflow-hidden">
                  <img
                    src={trip.coverImage || '/src/assets/images/hero_italy_amalfi_1791169026085.jpg'}
                    alt={trip.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                  <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-lg text-white text-[11px] font-semibold">
                    {getStatusText(trip.status)}
                  </div>
                  {isActive && (
                    <div className="absolute top-3 right-3 bg-emerald-600 text-white px-2 py-0.5 rounded-lg text-[10px] font-bold tracking-wider uppercase">
                      Activo
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 block truncate">
                      {trip.country} · {trip.totalDays} días
                    </span>
                    <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 font-serif mt-1 leading-snug line-clamp-1">
                      {trip.name}
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 line-clamp-2">
                      {trip.summary || trip.destination}
                    </p>
                  </div>

                  {/* Metadata */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-stone-600 dark:text-stone-400 pt-2 border-t border-stone-100 dark:border-stone-800">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-stone-400" />
                      <span className="truncate">{trip.startDate}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Wallet className="w-3.5 h-3.5 text-stone-400" />
                      <span className="font-mono font-semibold">
                        {trip.currency}{trip.budgetTotal}
                      </span>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onDuplicateTrip(trip.id)}
                        className="p-2 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                        title="Duplicar viaje"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      {trips.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`¿Eliminar ${trip.name}?`)) {
                              onDeleteTrip(trip.id);
                            }
                          }}
                          className="p-2 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                          title="Eliminar viaje"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => onSelectTrip(trip.id)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 transition-colors shadow-xs"
                    >
                      <span>Abrir</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
