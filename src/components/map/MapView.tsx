import React, { useState, useMemo } from 'react';
import {
  Compass,
  MapPin,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Navigation,
  Clock,
  DollarSign,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { Trip, Activity, ActivityCategory } from '../../types';
import { MapService } from '../../services/MapService';

interface MapViewProps {
  trip: Trip;
  onSelectActivity?: (activity: Activity) => void;
}

export const MapView: React.FC<MapViewProps> = ({ trip, onSelectActivity }) => {
  const [selectedDayId, setSelectedDayId] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPin, setSelectedPin] = useState<Activity | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Filter activities
  const activeActivities: Activity[] = useMemo(() => {
    let list: Activity[] = [];
    if (selectedDayId === 'all') {
      list = trip.days.flatMap((d) => d.activities);
    } else {
      const foundDay = trip.days.find((d) => d.id === selectedDayId);
      list = foundDay ? foundDay.activities : [];
    }

    if (selectedCategory !== 'all') {
      list = list.filter((a) => a.category === selectedCategory);
    }
    return list;
  }, [trip, selectedDayId, selectedCategory]);

  // Compute map bounds and project onto 1000x600 SVG canvas
  const svgWidth = 1000;
  const svgHeight = 600;

  const bounds = useMemo(() => {
    return MapService.getBounds(
      activeActivities.map((a) => ({
        latitude: a.latitude,
        longitude: a.longitude,
        category: a.category,
      }))
    );
  }, [activeActivities]);

  const projectToSvg = (lat: number, lng: number) => {
    const latSpan = bounds.maxLat - bounds.minLat || 1;
    const lngSpan = bounds.maxLng - bounds.minLng || 1;

    const x = ((lng - bounds.minLng) / lngSpan) * (svgWidth - 160) + 80;
    // Invert Y because latitude goes up north, but SVG Y goes down
    const y = ((bounds.maxLat - lat) / latSpan) * (svgHeight - 160) + 80;
    return { x, y };
  };

  // Generate route polyline points for sequential activities in a single day
  const routePoints = useMemo(() => {
    if (selectedDayId === 'all') return [];
    const points = activeActivities.map((a) => projectToSvg(a.latitude, a.longitude));
    return points;
  }, [activeActivities, bounds, selectedDayId]);

  return (
    <div className="space-y-4 pb-24 md:pb-12">
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#111918] border border-stone-200 dark:border-stone-800 shadow-sm">
        {/* Day Selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedDayId('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedDayId === 'all'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200'
            }`}
          >
            Todo el viaje ({trip.days.reduce((acc, d) => acc + d.activities.length, 0)} puntos)
          </button>
          {trip.days.map((day) => (
            <button
              key={day.id}
              type="button"
              onClick={() => setSelectedDayId(day.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedDayId === day.id
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200'
              }`}
            >
              Día {day.dayNumber} ({day.city})
            </button>
          ))}
        </div>

        {/* Category filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-stone-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs font-medium px-2.5 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-800 dark:text-stone-200 focus:outline-none"
          >
            <option value="all">Todas las categorías</option>
            <option value="culture">Monumentos y Cultura</option>
            <option value="gastronomy">Restaurantes y Cafés</option>
            <option value="sightseeing">Puntos Panorámicos</option>
            <option value="transport">Estaciones y Trenes</option>
            <option value="lodging">Hoteles</option>
            <option value="relaxation">Relax</option>
          </select>
        </div>
      </div>

      {/* Main Map Canvas Container */}
      <div className="relative w-full h-[520px] sm:h-[620px] rounded-3xl bg-[#eef2ef] dark:bg-[#0c1413] border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm flex items-center justify-center">
        {/* Subtle Map Grid lines / Cartographic texture */}
        <div
          className="absolute inset-0 opacity-[0.07] dark:opacity-[0.12] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#065f46 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />

        {/* Compass Rose water-mark motif */}
        <div className="absolute top-6 right-6 pointer-events-none opacity-20 dark:opacity-10 text-emerald-800 dark:text-emerald-300">
          <Compass className="w-24 h-24 stroke-[1.2]" />
        </div>

        {/* Zoom Controls */}
        <div className="absolute bottom-6 right-6 z-20 flex flex-col gap-1.5 bg-white/90 dark:bg-[#151f1e]/90 backdrop-blur-md p-1.5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-md">
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.min(2, z + 0.25))}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
            title="Acercar"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.max(0.75, z - 0.25))}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
            title="Alejar"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel(1)}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 text-[10px] font-mono font-bold"
            title="Restablecer"
          >
            1x
          </button>
        </div>

        {/* SVG Map Render */}
        <div
          className="w-full h-full flex items-center justify-center transition-transform duration-300 ease-out"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-full max-h-full"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#059669" />
                <stop offset="100%" stopColor="#0284c7" />
              </linearGradient>
              <filter id="pinShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.25" />
              </filter>
            </defs>

            {/* Connecting Routes (when a specific day is selected) */}
            {routePoints.length > 1 && (
              <>
                <polyline
                  points={routePoints.map((p) => `${p.x},${p.y}`).join(' ')}
                  fill="none"
                  stroke="url(#routeGrad)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="6 4"
                  className="animate-pulse"
                />
                {/* Route distance labels */}
                {routePoints.slice(0, -1).map((pt, i) => {
                  const nextPt = routePoints[i + 1];
                  const midX = (pt.x + nextPt.x) / 2;
                  const midY = (pt.y + nextPt.y) / 2;
                  return (
                    <circle
                      key={`mid-${i}`}
                      cx={midX}
                      cy={midY}
                      r="3"
                      fill="#059669"
                      opacity="0.8"
                    />
                  );
                })}
              </>
            )}

            {/* Pins */}
            {activeActivities.map((activity, index) => {
              const { x, y } = projectToSvg(activity.latitude, activity.longitude);
              const theme = MapService.getCategoryTheme(activity.category);
              const isSelected = selectedPin?.id === activity.id;

              return (
                <g
                  key={activity.id}
                  className="cursor-pointer transition-transform duration-200 hover:scale-110"
                  onClick={() => setSelectedPin(activity)}
                  filter="url(#pinShadow)"
                >
                  {/* Pin Pulse if selected */}
                  {isSelected && (
                    <circle
                      cx={x}
                      cy={y - 12}
                      r="22"
                      fill={theme.color}
                      opacity="0.25"
                      className="animate-ping"
                    />
                  )}

                  {/* Pin body */}
                  <path
                    d={`M ${x} ${y} C ${x - 14} ${y - 14}, ${x - 14} ${y - 28}, ${x} ${y - 28} C ${x + 14} ${y - 28}, ${x + 14} ${y - 14}, ${x} ${y} Z`}
                    fill={theme.color}
                    stroke="#ffffff"
                    strokeWidth="2"
                  />

                  {/* Pin center dot or index */}
                  <circle cx={x} cy={y - 18} r="6" fill="#ffffff" />
                  <text
                    x={x}
                    y={y - 15}
                    fontSize="9"
                    fontWeight="bold"
                    fill={theme.color}
                    textAnchor="middle"
                  >
                    {index + 1}
                  </text>

                  {/* Label on canvas */}
                  <text
                    x={x}
                    y={y + 14}
                    fontSize="10"
                    fontWeight="600"
                    fill="currentColor"
                    className="text-stone-700 dark:text-stone-200 fill-current select-none"
                    textAnchor="middle"
                  >
                    {activity.name.slice(0, 18)}
                    {activity.name.length > 18 ? '…' : ''}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Selected Pin Popover Card */}
        {selectedPin && (
          <div className="absolute top-6 left-6 z-30 w-80 max-w-[calc(100vw-3rem)] bg-white/95 dark:bg-[#111918]/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-stone-200 dark:border-stone-800 animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span
                  style={{ color: MapService.getCategoryTheme(selectedPin.category).color }}
                  className="text-xs font-bold uppercase tracking-wider block"
                >
                  {MapService.getCategoryTheme(selectedPin.category).label}
                </span>
                <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 font-serif leading-snug mt-0.5">
                  {selectedPin.name}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPin(null)}
                className="w-6 h-6 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
              >
                ×
              </button>
            </div>

            <div className="mt-2 text-xs text-stone-500 dark:text-stone-400 space-y-1">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-stone-400" />
                <span className="font-mono">{selectedPin.startTime} — {selectedPin.endTime}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-stone-400" />
                <span className="truncate">{selectedPin.location}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-stone-400" />
                <span className="font-mono font-semibold text-stone-900 dark:text-stone-100">
                  {trip.currency}{selectedPin.estimatedCost}
                </span>
              </div>
            </div>

            {selectedPin.description && (
              <p className="mt-2 text-xs text-stone-600 dark:text-stone-300 line-clamp-2">
                {selectedPin.description}
              </p>
            )}

            {onSelectActivity && (
              <button
                type="button"
                onClick={() => onSelectActivity(selectedPin)}
                className="mt-3 w-full py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1"
              >
                <span>Ver detalles</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Legend & Categories */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#111918] border border-stone-200 dark:border-stone-800 flex flex-wrap items-center gap-4 text-xs text-stone-600 dark:text-stone-400">
        <span className="font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-emerald-600" /> Leyenda:
        </span>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#059669]" />
          <span>Cultura</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#d97706]" />
          <span>Gastronomía</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#0284c7]" />
          <span>Puntos Turísticos</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#7c3aed]" />
          <span>Transporte / Estaciones</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#db2777]" />
          <span>Alojamiento</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#0d9488]" />
          <span>Relax</span>
        </div>
      </div>
    </div>
  );
};
