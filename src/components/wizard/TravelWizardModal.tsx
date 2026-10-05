import React, { useState, useEffect } from 'react';
import {
  X,
  ChevronRight,
  ChevronLeft,
  MapPin,
  Calendar,
  Users,
  Wallet,
  Sparkles,
  Compass,
  CheckCircle2,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { Trip, DayPlan, Activity, TravelPace, BudgetTier } from '../../types';

interface TravelWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTripCreated: (trip: Trip) => void;
}

const INTERESTS_OPTIONS = [
  'Historia',
  'Cultura',
  'Gastronomía',
  'Naturaleza',
  'Playas',
  'Aventura',
  'Arte',
  'Arquitectura',
  'Compras',
  'Vida nocturna',
  'Fotografía',
  'Relax',
  'Deportes',
  'Pueblos',
  'Road trip',
];

const POPULAR_DESTINATIONS = [
  { name: 'Italia (Roma, Florencia, Venecia)', country: 'Italia', cities: ['Roma', 'Florencia', 'Venecia'] },
  { name: 'Japón (Tokio, Kioto, Osaka)', country: 'Japón', cities: ['Tokio', 'Kioto', 'Osaka'] },
  { name: 'España (Madrid, Barcelona, Sevilla)', country: 'España', cities: ['Madrid', 'Barcelona', 'Sevilla'] },
  { name: 'Francia (París, Valle del Loira, Niza)', country: 'Francia', cities: ['París', 'Valle del Loira', 'Niza'] },
  { name: 'Argentina (Buenos Aires, Bariloche, Mendoza)', country: 'Argentina', cities: ['Buenos Aires', 'Bariloche', 'Mendoza'] },
];

export const TravelWizardModal: React.FC<TravelWizardModalProps> = ({
  isOpen,
  onClose,
  onTripCreated,
}) => {
  const [step, setStep] = useState(1);
  const [destinationInput, setDestinationInput] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('Italia');
  const [citiesInput, setCitiesInput] = useState('Roma, Florencia, Venecia');

  const [startDate, setStartDate] = useState('2026-06-10');
  const [endDate, setEndDate] = useState('2026-06-18');

  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [travelerProfile, setTravelerProfile] = useState<'couple' | 'family' | 'friends' | 'solo'>('couple');

  const [budgetTier, setBudgetTier] = useState<BudgetTier>('medium');
  const [customBudget, setCustomBudget] = useState(2500);

  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    'Historia',
    'Gastronomía',
    'Cultura',
    'Pueblos',
  ]);

  const [pace, setPace] = useState<TravelPace>('balanced');

  // Generation animation state
  const [generationStep, setGenerationStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTrip, setGeneratedTrip] = useState<Trip | null>(null);

  // Calculate days and nights
  const calculateDuration = () => {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return {
        days: Math.max(1, diffDays),
        nights: Math.max(0, diffDays - 1),
      };
    } catch {
      return { days: 7, nights: 6 };
    }
  };

  const { days, nights } = calculateDuration();

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  // Step 7: Generation simulation
  useEffect(() => {
    if (step === 7 && isGenerating) {
      const steps = [
        'Analizando destino y climatología...',
        'Organizando ciudades y conexiones de transporte...',
        'Distribuyendo días y tiempos de estadía...',
        'Agrupando actividades por cercanía geográfica...',
        'Optimizando itinerarios y pausas gastronómicas...',
        'Calculando presupuesto y reservas recomendadas...',
      ];

      const interval = setInterval(() => {
        setGenerationStep((prev) => {
          if (prev < steps.length - 1) {
            return prev + 1;
          } else {
            clearInterval(interval);
            finishGeneration();
            return prev;
          }
        });
      }, 700);

      return () => clearInterval(interval);
    }
  }, [step, isGenerating]);

  const startGeneration = () => {
    setStep(7);
    setIsGenerating(true);
    setGenerationStep(0);
  };

  const finishGeneration = () => {
    setIsGenerating(false);

    const cities = citiesInput
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    const tripId = `trip-${Date.now()}`;
    const generatedDays: DayPlan[] = [];

    const cityCount = Math.max(1, cities.length);
    const daysPerCity = Math.ceil(days / cityCount);

    for (let d = 1; d <= days; d++) {
      const cityIndex = Math.min(cities.length - 1, Math.floor((d - 1) / daysPerCity));
      const currentCity = cities[cityIndex] || destinationInput || 'Destino';

      const dateObj = new Date(startDate);
      dateObj.setDate(dateObj.getDate() + (d - 1));
      const dateStr = dateObj.toISOString().split('T')[0];

      const dayActivities: Activity[] = [
        {
          id: `act-${tripId}-${d}-1`,
          dayId: `day-${tripId}-${d}`,
          name: `Desayuno tradicional en ${currentCity}`,
          description: `Cafetería artesanal para arrancar el día con especialidades locales y café de tueste local.`,
          category: 'gastronomy',
          startTime: '09:00',
          endTime: '09:45',
          durationMinutes: 45,
          location: `Centro histórico de ${currentCity}`,
          latitude: 41.9 + (d * 0.05),
          longitude: 12.4 + (d * 0.05),
          estimatedCost: 15,
          currency: '€',
          completed: false,
        },
        {
          id: `act-${tripId}-${d}-2`,
          dayId: `day-${tripId}-${d}`,
          name: `Exploración destacada de ${currentCity}`,
          description: `Recorrido por monumentos icónicos y plazas emblemáticas con tiempo para fotos.`,
          category: selectedInterests.includes('Arte') || selectedInterests.includes('Historia') ? 'culture' : 'sightseeing',
          startTime: '10:30',
          endTime: '13:00',
          durationMinutes: 150,
          location: `Hito histórico de ${currentCity}`,
          latitude: 41.91 + (d * 0.05),
          longitude: 12.42 + (d * 0.05),
          estimatedCost: 25,
          currency: '€',
          completed: false,
          distanceFromPreviousKm: 1.2,
        },
        {
          id: `act-${tripId}-${d}-3`,
          dayId: `day-${tripId}-${d}`,
          name: `Almuerzo en trattoria típica`,
          description: `Menú de estación con maridaje de vino de la región y postre casero.`,
          category: 'gastronomy',
          startTime: '13:30',
          endTime: '15:00',
          durationMinutes: 90,
          location: `Barrio tradicional de ${currentCity}`,
          latitude: 41.92 + (d * 0.05),
          longitude: 12.43 + (d * 0.05),
          estimatedCost: 35,
          currency: '€',
          completed: false,
          distanceFromPreviousKm: 0.8,
        },
      ];

      if (pace !== 'relax') {
        dayActivities.push({
          id: `act-${tripId}-${d}-4`,
          dayId: `day-${tripId}-${d}`,
          name: `Paseo de atardecer y mirador en ${currentCity}`,
          description: `Las mejores vistas panorámicas de la ciudad con la luz dorada de la tarde.`,
          category: 'relaxation',
          startTime: '18:00',
          endTime: '19:30',
          durationMinutes: 90,
          location: `Mirador de ${currentCity}`,
          latitude: 41.93 + (d * 0.05),
          longitude: 12.44 + (d * 0.05),
          estimatedCost: 10,
          currency: '€',
          completed: false,
          distanceFromPreviousKm: 1.5,
        });
      }

      dayActivities.push({
        id: `act-${tripId}-${d}-5`,
        dayId: `day-${tripId}-${d}`,
        name: `Cena y paseo nocturno`,
        description: `Ambiente acogedor para saborear la gastronomía nocturna y relajarse.`,
        category: 'gastronomy',
        startTime: '20:30',
        endTime: '22:30',
        durationMinutes: 120,
        location: `Zona de restaurantes de ${currentCity}`,
        latitude: 41.92 + (d * 0.05),
        longitude: 12.42 + (d * 0.05),
        estimatedCost: 40,
        currency: '€',
        completed: false,
        distanceFromPreviousKm: 1.0,
      });

      generatedDays.push({
        id: `day-${tripId}-${d}`,
        tripId,
        dayNumber: d,
        date: dateStr,
        city: currentCity,
        theme: `Día ${d}: Experiencias en ${currentCity}`,
        activities: dayActivities,
      });
    }

    const trip: Trip = {
      id: tripId,
      name: `Viaje a ${destinationInput || selectedCountry}: ${cities.slice(0, 3).join(', ')}`,
      destination: `${destinationInput || selectedCountry} (${cities.join(' → ')})`,
      destinationsList: cities,
      country: selectedCountry,
      startDate,
      endDate,
      totalDays: days,
      totalNights: nights,
      travelers: {
        adults,
        children,
        profile: travelerProfile,
      },
      budgetTotal: customBudget,
      budgetTier,
      currency: '€',
      pace,
      interests: selectedInterests,
      status: 'planning',
      coverImage: '/src/assets/images/hero_italy_amalfi_1791169026085.jpg',
      summary: `Itinerario personalizado de ${days} días diseñado para ${adults + children} viajeros con ritmo ${pace} e intereses en ${selectedInterests.slice(0, 3).join(', ')}.`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      days: generatedDays,
      expenses: [
        {
          id: `exp-${Date.now()}-1`,
          tripId,
          category: 'lodging',
          description: `Alojamiento estimado (${nights} noches)`,
          amount: Math.round(customBudget * 0.45),
          currency: '€',
          date: startDate,
        },
        {
          id: `exp-${Date.now()}-2`,
          tripId,
          category: 'transport',
          description: 'Trenes y traslados internos',
          amount: Math.round(customBudget * 0.2),
          currency: '€',
          date: startDate,
        },
      ],
      checklist: [
        {
          id: `chk-${Date.now()}-1`,
          tripId,
          phase: 'before',
          category: 'Documentación',
          title: 'Verificar pasaportes y visados necesarios',
          completed: false,
        },
        {
          id: `chk-${Date.now()}-2`,
          tripId,
          phase: 'before',
          category: 'Salud',
          title: 'Contratar seguro médico internacional de viaje',
          completed: false,
        },
        {
          id: `chk-${Date.now()}-3`,
          tripId,
          phase: 'before',
          category: 'Finanzas',
          title: 'Habilitar tarjetas para uso en el extranjero',
          completed: false,
        },
      ],
      memories: [],
    };

    setGeneratedTrip(trip);
  };

  const handleFinish = () => {
    if (generatedTrip) {
      onTripCreated(generatedTrip);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#111918] rounded-2xl sm:rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-stone-800">
          <div>
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              {step < 7 ? `Paso ${step} de 6` : 'Generador Inteligente'}
            </span>
            <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 font-serif">
              {step === 1 && '¿A dónde querés viajar?'}
              {step === 2 && '¿En qué fechas?'}
              {step === 3 && '¿Quiénes viajan?'}
              {step === 4 && '¿Cuál es tu presupuesto?'}
              {step === 5 && '¿Qué experiencias te interesan?'}
              {step === 6 && '¿Qué ritmo prefieres?'}
              {step === 7 && 'Diseñando tu viaje ideal'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress bar */}
        {step < 7 && (
          <div className="w-full bg-stone-100 dark:bg-stone-800 h-1">
            <div
              className="bg-emerald-600 h-1 transition-all duration-300"
              style={{ width: `${(step / 6) * 100}%` }}
            />
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* STEP 1: DESTINATION */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-stone-600 dark:text-stone-300">
                Elegí un país o múltiples ciudades conectadas para tu recorrido.
              </p>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                  Destino principal / País
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-stone-400 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    value={destinationInput}
                    onChange={(e) => setDestinationInput(e.target.value)}
                    placeholder="Ej. Italia, Japón, España, Francia..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                  Ciudades o etapas (separadas por comas)
                </label>
                <input
                  type="text"
                  value={citiesInput}
                  onChange={(e) => setCitiesInput(e.target.value)}
                  placeholder="Ej. Roma, Florencia, Venecia, Milán"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm"
                />
              </div>

              <div>
                <span className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-2">
                  Destinos sugeridos con itinerario optimizado:
                </span>
                <div className="space-y-2">
                  {POPULAR_DESTINATIONS.map((dest) => (
                    <button
                      key={dest.name}
                      type="button"
                      onClick={() => {
                        setSelectedCountry(dest.country);
                        setDestinationInput(dest.name);
                        setCitiesInput(dest.cities.join(', '));
                      }}
                      className="w-full text-left p-3 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-emerald-500/60 dark:hover:border-emerald-500/60 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 transition-all flex items-center justify-between text-xs sm:text-sm font-medium text-stone-800 dark:text-stone-200"
                    >
                      <span>{dest.name}</span>
                      <ArrowRight className="w-4 h-4 text-emerald-600" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: DATES */}
          {step === 2 && (
            <div className="space-y-5">
              <p className="text-sm text-stone-600 dark:text-stone-300">
                Selecciona las fechas de inicio y fin. Calculamos los días y noches automáticamente.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                    Fecha de inicio
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                    Fecha de finalización
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm"
                  />
                </div>
              </div>

              {/* Duration calculation banner */}
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-700 text-white flex items-center justify-center">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold uppercase tracking-wider">
                      Duración calculada
                    </span>
                    <p className="text-base font-bold text-emerald-950 dark:text-emerald-100">
                      {days} días / {nights} noches
                    </p>
                  </div>
                </div>
                <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                  Itinerario completo
                </span>
              </div>
            </div>
          )}

          {/* STEP 3: TRAVELERS */}
          {step === 3 && (
            <div className="space-y-5">
              <p className="text-sm text-stone-600 dark:text-stone-300">
                Indicá cuántas personas viajan para ajustar alojamientos, traslados y mesas.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/60 flex items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold text-stone-900 dark:text-stone-100">Adultos</span>
                    <span className="block text-xs text-stone-500">+12 años</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAdults((prev) => Math.max(1, prev - 1))}
                      className="w-8 h-8 rounded-lg bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-200 font-bold"
                    >
                      -
                    </button>
                    <span className="w-6 text-center font-bold text-stone-900 dark:text-stone-100">{adults}</span>
                    <button
                      type="button"
                      onClick={() => setAdults((prev) => prev + 1)}
                      className="w-8 h-8 rounded-lg bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-200 font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/60 flex items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold text-stone-900 dark:text-stone-100">Niños</span>
                    <span className="block text-xs text-stone-500">0 - 11 años</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setChildren((prev) => Math.max(0, prev - 1))}
                      className="w-8 h-8 rounded-lg bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-200 font-bold"
                    >
                      -
                    </button>
                    <span className="w-6 text-center font-bold text-stone-900 dark:text-stone-100">{children}</span>
                    <button
                      type="button"
                      onClick={() => setChildren((prev) => prev + 1)}
                      className="w-8 h-8 rounded-lg bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-200 font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-2">
                  Tipo de grupo / Perfil
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'couple', label: 'En pareja' },
                    { id: 'solo', label: 'Solo' },
                    { id: 'family', label: 'Familia' },
                    { id: 'friends', label: 'Con amigos' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setTravelerProfile(p.id as any)}
                      className={`p-3 rounded-xl text-xs font-medium border text-center transition-all ${
                        travelerProfile === p.id
                          ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-semibold'
                          : 'border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: BUDGET */}
          {step === 4 && (
            <div className="space-y-5">
              <p className="text-sm text-stone-600 dark:text-stone-300">
                Seleccioná el nivel de presupuesto para adaptar recomendaciones de hoteles, cenas y actividades.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: 'budget', label: 'Económico', desc: 'Hostels, tren regional, street food' },
                  { id: 'medium', label: 'Medio', desc: 'Hoteles 3*, trattorias, museos' },
                  { id: 'comfort', label: 'Cómodo', desc: 'Hoteles boutique 4*, tours guiados' },
                  { id: 'luxury', label: 'Premium', desc: 'Hoteles 5*, alta cocina, traslados privados' },
                ].map((tier) => (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => {
                      setBudgetTier(tier.id as BudgetTier);
                      if (tier.id === 'budget') setCustomBudget(1200);
                      if (tier.id === 'medium') setCustomBudget(2500);
                      if (tier.id === 'comfort') setCustomBudget(4000);
                      if (tier.id === 'luxury') setCustomBudget(7500);
                    }}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      budgetTier === tier.id
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 ring-1 ring-emerald-600'
                        : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
                    }`}
                  >
                    <span className="block font-bold text-stone-900 dark:text-stone-100 text-sm">
                      {tier.label}
                    </span>
                    <span className="block text-[11px] text-stone-500 dark:text-stone-400 mt-1 line-clamp-2">
                      {tier.desc}
                    </span>
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                  Presupuesto total estimado (€ EUR)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-stone-500 font-bold">€</span>
                  <input
                    type="number"
                    value={customBudget}
                    onChange={(e) => setCustomBudget(Number(e.target.value))}
                    step="100"
                    min="100"
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-mono text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <span className="block text-xs text-stone-500 dark:text-stone-400 mt-1">
                  Aproximadamente €{Math.round(customBudget / Math.max(1, days))} por día para el grupo.
                </span>
              </div>
            </div>
          )}

          {/* STEP 5: STYLE & INTERESTS */}
          {step === 5 && (
            <div className="space-y-4">
              <p className="text-sm text-stone-600 dark:text-stone-300">
                Seleccioná tus intereses favoritos. Combinaremos las actividades para lograr el equilibrio perfecto.
              </p>

              <div className="flex flex-wrap gap-2">
                {INTERESTS_OPTIONS.map((interest) => {
                  const isSelected = selectedInterests.includes(interest);
                  return (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-emerald-700 text-white font-semibold shadow-sm'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                      }`}
                    >
                      {interest}
                    </button>
                  );
                })}
              </div>

              <div className="text-xs text-stone-500 dark:text-stone-400 pt-2">
                {selectedInterests.length} intereses seleccionados
              </div>
            </div>
          )}

          {/* STEP 6: PACE */}
          {step === 6 && (
            <div className="space-y-4">
              <p className="text-sm text-stone-600 dark:text-stone-300">
                ¿Qué intensidad de viaje preferís para cada jornada?
              </p>

              <div className="space-y-3">
                {[
                  {
                    id: 'relax',
                    title: 'Relax',
                    desc: 'Pocas actividades fijas (1-2 por día) y amplio tiempo libre para pasear sin reloj.',
                  },
                  {
                    id: 'balanced',
                    title: 'Equilibrado',
                    desc: 'Combinación armoniosa de visitas culturales en la mañana y tarde relajada.',
                  },
                  {
                    id: 'intense',
                    title: 'Intenso',
                    desc: 'Máximo aprovechamiento del tiempo: itinerario dinámico para conocer a fondo cada rincón.',
                  },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPace(item.id as TravelPace)}
                    className={`w-full p-4 rounded-xl border text-left transition-all flex items-start gap-3 ${
                      pace === item.id
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 ring-1 ring-emerald-600'
                        : 'border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/60'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border mt-0.5 flex items-center justify-center ${
                        pace === item.id ? 'border-emerald-600 bg-emerald-600' : 'border-stone-300 dark:border-stone-600'
                      }`}
                    >
                      {pace === item.id && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <div>
                      <span className="block font-bold text-stone-900 dark:text-stone-100 text-sm">
                        {item.title}
                      </span>
                      <span className="block text-xs text-stone-600 dark:text-stone-400 mt-0.5">
                        {item.desc}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 7: GENERATING & RESULT */}
          {step === 7 && (
            <div className="py-8 text-center space-y-6">
              {isGenerating ? (
                <>
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 animate-spin">
                    <Compass className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100 font-serif">
                      Estamos diseñando tu viaje...
                    </h3>
                    <p className="text-sm text-stone-500 dark:text-stone-400 mt-2 font-medium">
                      {[
                        'Analizando destino y climatología...',
                        'Organizando ciudades y conexiones de transporte...',
                        'Distribuyendo días y tiempos de estadía...',
                        'Agrupando actividades por cercanía geográfica...',
                        'Optimizando itinerarios y pausas gastronómicas...',
                        'Calculando presupuesto y reservas recomendadas...',
                      ][generationStep]}
                    </p>
                  </div>
                  <div className="w-full max-w-xs mx-auto bg-stone-100 dark:bg-stone-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-600 h-2 transition-all duration-500"
                      style={{ width: `${((generationStep + 1) / 6) * 100}%` }}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/20">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-stone-900 dark:text-stone-100 font-serif">
                      ¡Tu itinerario está listo!
                    </h3>
                    <p className="text-sm text-stone-600 dark:text-stone-300 mt-2 max-w-md mx-auto">
                      Hemos organizado los {days} días con actividades geográficamente agrupadas,
                      tiempos de traslado realistas y presupuesto equilibrado.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 text-left space-y-2 max-w-md mx-auto">
                    <div className="flex justify-between text-xs text-stone-600 dark:text-stone-400">
                      <span>Destino:</span>
                      <span className="font-semibold text-stone-900 dark:text-stone-100">
                        {citiesInput || destinationInput}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-stone-600 dark:text-stone-400">
                      <span>Duración:</span>
                      <span className="font-semibold text-stone-900 dark:text-stone-100">
                        {days} días ({nights} noches)
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-stone-600 dark:text-stone-400">
                      <span>Presupuesto total:</span>
                      <span className="font-semibold text-stone-900 dark:text-stone-100">
                        €{customBudget}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-stone-600 dark:text-stone-400">
                      <span>Ritmo seleccionado:</span>
                      <span className="font-semibold text-stone-900 dark:text-stone-100 capitalize">
                        {pace}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer controls */}
        <div className="px-6 py-4 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50 dark:bg-stone-900/40">
          {step > 1 && step < 7 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Atrás</span>
            </button>
          ) : (
            <div />
          )}

          {step < 6 && (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 transition-all shadow-sm"
            >
              <span>Continuar</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          {step === 6 && (
            <button
              type="button"
              onClick={startGeneration}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 transition-all shadow-md shadow-emerald-700/20 active:scale-[0.98]"
            >
              <Sparkles className="w-4 h-4 text-emerald-200" />
              <span>Generar viaje</span>
            </button>
          )}

          {step === 7 && !isGenerating && (
            <button
              type="button"
              onClick={handleFinish}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 transition-all shadow-md shadow-emerald-700/20"
            >
              <span>Abrir mi itinerario</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
