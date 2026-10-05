import React, { useState } from 'react';
import { CheckCircle2, Circle, Plus, Trash2, Shield, Luggage, FileCheck, CheckSquare } from 'lucide-react';
import { Trip, ChecklistItem } from '../../types';

interface ChecklistViewProps {
  trip: Trip;
  onUpdateTrip: (updated: Trip) => void;
}

export const ChecklistView: React.FC<ChecklistViewProps> = ({ trip, onUpdateTrip }) => {
  const [phaseFilter, setPhaseFilter] = useState<'all' | 'before' | 'during'>('all');
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('General');
  const [newItemPhase, setNewItemPhase] = useState<'before' | 'during'>('before');

  const total = trip.checklist.length;
  const completedCount = trip.checklist.filter((c) => c.completed).length;
  const percent = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  const toggleItem = (itemId: string) => {
    const updated = trip.checklist.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    onUpdateTrip({ ...trip, checklist: updated });
  };

  const deleteItem = (itemId: string) => {
    const updated = trip.checklist.filter((item) => item.id !== itemId);
    onUpdateTrip({ ...trip, checklist: updated });
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle.trim()) return;

    const newItem: ChecklistItem = {
      id: `chk-${Date.now()}`,
      tripId: trip.id,
      phase: newItemPhase,
      category: newItemCategory.trim() || 'General',
      title: newItemTitle.trim(),
      completed: false,
    };

    onUpdateTrip({
      ...trip,
      checklist: [...trip.checklist, newItem],
    });

    setNewItemTitle('');
  };

  const filteredItems = trip.checklist.filter((item) => {
    if (phaseFilter === 'all') return true;
    return item.phase === phaseFilter;
  });

  return (
    <div className="space-y-6 pb-24 md:pb-12 max-w-3xl mx-auto">
      {/* Progress Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#111918] border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            Preparativos del Viaje
          </span>
          <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100 font-serif">
            Checklist de {trip.name}
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            {completedCount} de {total} tareas completadas ({percent}%)
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full sm:w-48 bg-stone-100 dark:bg-stone-800 h-3 rounded-full overflow-hidden">
          <div
            className="bg-emerald-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setPhaseFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
            phaseFilter === 'all'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200'
          }`}
        >
          Todas ({total})
        </button>
        <button
          type="button"
          onClick={() => setPhaseFilter('before')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
            phaseFilter === 'before'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200'
          }`}
        >
          Antes del viaje ({trip.checklist.filter((i) => i.phase === 'before').length})
        </button>
        <button
          type="button"
          onClick={() => setPhaseFilter('during')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
            phaseFilter === 'during'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200'
          }`}
        >
          Durante el viaje ({trip.checklist.filter((i) => i.phase === 'during').length})
        </button>
      </div>

      {/* Add Item Form */}
      <form
        onSubmit={handleAddItem}
        className="p-4 rounded-2xl bg-white dark:bg-[#111918] border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col sm:flex-row gap-2.5 items-center"
      >
        <input
          type="text"
          value={newItemTitle}
          onChange={(e) => setNewItemTitle(e.target.value)}
          placeholder="Agregar nuevo ítem al checklist..."
          className="flex-1 w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />

        <select
          value={newItemPhase}
          onChange={(e) => setNewItemPhase(e.target.value as 'before' | 'during')}
          className="px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-xs focus:outline-none"
        >
          <option value="before">Antes del viaje</option>
          <option value="during">Durante el viaje</option>
        </select>

        <button
          type="submit"
          disabled={!newItemTitle.trim()}
          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar</span>
        </button>
      </form>

      {/* Items list */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#111918] border border-stone-200 dark:border-stone-800 shadow-sm divide-y divide-stone-100 dark:divide-stone-800">
        {filteredItems.length === 0 ? (
          <div className="py-8 text-center text-xs text-stone-500">
            No hay ítems en esta sección.
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className="py-3.5 flex items-center justify-between gap-3 group"
            >
              <div
                className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                onClick={() => toggleItem(item.id)}
              >
                <button
                  type="button"
                  className="text-stone-400 hover:text-emerald-600 transition-colors shrink-0"
                >
                  {item.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Circle className="w-5 h-5 text-stone-300 dark:text-stone-600" />
                  )}
                </button>
                <div className="min-w-0">
                  <span
                    className={`text-sm font-medium block truncate ${
                      item.completed
                        ? 'line-through text-stone-400 dark:text-stone-500'
                        : 'text-stone-800 dark:text-stone-200'
                    }`}
                  >
                    {item.title}
                  </span>
                  <div className="flex items-center gap-2 text-[10px] text-stone-400">
                    <span>{item.category}</span>
                    <span>·</span>
                    <span>{item.phase === 'before' ? 'Antes del viaje' : 'Durante el viaje'}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => deleteItem(item.id)}
                className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 opacity-0 group-hover:opacity-100 transition-all"
                title="Eliminar ítem"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
