import React, { useState } from 'react';
import { Camera, Plus, Star, MapPin, Calendar, Trash2, X, Tag, Heart } from 'lucide-react';
import { Trip, Memory } from '../../types';

interface MemoriesViewProps {
  trip: Trip;
  onUpdateTrip: (updated: Trip) => void;
}

export const MemoriesView: React.FC<MemoriesViewProps> = ({ trip, onUpdateTrip }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [note, setNote] = useState('');
  const [rating, setRating] = useState(5);
  const [tagsInput, setTagsInput] = useState('Experiencia, Historia');
  const [imageUrl, setImageUrl] = useState('/src/assets/images/hero_italy_amalfi_1791169026085.jpg');

  const handleAddMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newMemory: Memory = {
      id: `mem-${Date.now()}`,
      tripId: trip.id,
      title: title.trim(),
      location: location.trim() || trip.destination,
      date: new Date().toISOString().split('T')[0],
      note: note.trim(),
      rating,
      imageUrl,
      tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
    };

    onUpdateTrip({
      ...trip,
      memories: [newMemory, ...trip.memories],
    });

    setTitle('');
    setLocation('');
    setNote('');
    setIsModalOpen(false);
  };

  const handleDeleteMemory = (memId: string) => {
    onUpdateTrip({
      ...trip,
      memories: trip.memories.filter((m) => m.id !== memId),
    });
  };

  return (
    <div className="space-y-6 pb-24 md:pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-[#111918] border border-stone-200 dark:border-stone-800 shadow-sm">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            Diario de Viaje
          </span>
          <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100 font-serif">
            Recuerdos de {trip.name}
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Captura momentos, restaurantes memorables y reflexiones para revivir la aventura.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar recuerdo</span>
        </button>
      </div>

      {/* Memory Grid */}
      {trip.memories.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-white dark:bg-[#111918] border border-dashed border-stone-300 dark:border-stone-800 space-y-3">
          <Camera className="w-10 h-10 text-stone-400 mx-auto" />
          <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 font-serif">
            Aún no has guardado recuerdos en este viaje
          </h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Añade tus fotos y notas de cada rincón visitado para construir tu diario de viaje.
          </p>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Crear primer recuerdo</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trip.memories.map((mem) => (
            <div
              key={mem.id}
              className="rounded-3xl bg-white dark:bg-[#111918] border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col"
            >
              {/* Photo */}
              {mem.imageUrl && (
                <div className="relative h-48 w-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                  <img
                    src={mem.imageUrl}
                    alt={mem.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-xs px-2 py-1 rounded-lg flex items-center gap-1 text-white text-xs font-semibold">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span>{mem.rating}</span>
                  </div>
                </div>
              )}

              {/* Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {mem.location}
                    </span>
                    <span>·</span>
                    <span>{mem.date}</span>
                  </div>

                  <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 font-serif leading-snug">
                    {mem.title}
                  </h3>

                  <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed line-clamp-3">
                    {mem.note}
                  </p>
                </div>

                <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {mem.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="text-[10px] text-stone-500 dark:text-stone-400"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteMemory(mem.id)}
                    className="p-1 text-stone-400 hover:text-rose-600 transition-colors"
                    title="Eliminar recuerdo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Memory Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111918] rounded-3xl p-6 max-w-md w-full border border-stone-200 dark:border-stone-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 font-serif">
                Nuevo Recuerdo de Viaje
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-stone-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddMemory} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Título del momento *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej. Atardecer en Piazzale Michelangelo"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Ubicación
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ej. Florencia, Toscana"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Imagen destacada
                </label>
                <select
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-xs focus:outline-none"
                >
                  <option value="/src/assets/images/hero_italy_amalfi_1791169026085.jpg">Paisaje italiano</option>
                  <option value="/src/assets/images/trip_rome_colosseum_1791169040903.jpg">Coliseo Romano</option>
                  <option value="/src/assets/images/trip_florence_duomo_1791169050574.jpg">Duomo de Florencia</option>
                  <option value="/src/assets/images/trip_venice_canals_1791169059668.jpg">Canales de Venecia</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Notas y sensaciones
                </label>
                <textarea
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Describe lo que sentiste, el sabor del plato, la música..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Valoración (1 a 5 estrellas)
                </label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 text-amber-400 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-5 h-5 ${star <= rating ? 'fill-amber-400' : 'text-stone-300'}`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 shadow-sm"
                >
                  Guardar recuerdo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
