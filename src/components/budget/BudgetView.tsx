import React, { useState } from 'react';
import {
  Wallet,
  Plus,
  Trash2,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  PieChart,
  Tag,
  Calendar,
  X,
  CreditCard,
} from 'lucide-react';
import { Trip, Expense, ExpenseCategory } from '../../types';

interface BudgetViewProps {
  trip: Trip;
  onUpdateTrip: (updated: Trip) => void;
}

const CATEGORY_META: Record<
  ExpenseCategory,
  { label: string; icon: string; color: string; bg: string }
> = {
  lodging: { label: 'Alojamiento', icon: '🏨', color: '#db2777', bg: 'bg-pink-500' },
  transport: { label: 'Transporte', icon: '✈️', color: '#7c3aed', bg: 'bg-purple-500' },
  transfers: { label: 'Traslados', icon: '🚆', color: '#0284c7', bg: 'bg-sky-500' },
  food: { label: 'Comida', icon: '🍝', color: '#d97706', bg: 'bg-amber-500' },
  activities: { label: 'Actividades', icon: '🎟️', color: '#059669', bg: 'bg-emerald-500' },
  shopping: { label: 'Compras', icon: '🛍️', color: '#ea580c', bg: 'bg-orange-500' },
  other: { label: 'Otros', icon: '💰', color: '#64748b', bg: 'bg-slate-500' },
};

export const BudgetView: React.FC<BudgetViewProps> = ({ trip, onUpdateTrip }) => {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState(50);
  const [category, setCategory] = useState<ExpenseCategory>('food');
  const [date, setDate] = useState(trip.startDate || new Date().toISOString().split('T')[0]);
  const [paidBy, setPaidBy] = useState('Tarjeta');

  // Math
  const totalBudget = trip.budgetTotal;
  const actualSpent = trip.expenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);

  // Sum of all activity estimated costs in the trip
  const activitiesEstimatedSum = trip.days.reduce(
    (sum, d) => sum + d.activities.reduce((aSum, a) => aSum + (a.estimatedCost || 0), 0),
    0
  );

  // Estimated total: sum of estimated activities + registered fixed expenses
  const totalEstimated = activitiesEstimatedSum + actualSpent;
  const remaining = totalBudget - actualSpent;
  const percentageSpent = Math.min(100, Math.round((actualSpent / Math.max(1, totalBudget)) * 100));

  // Category breakdown
  const categoryTotals: Record<ExpenseCategory, number> = {
    lodging: 0,
    transport: 0,
    transfers: 0,
    food: 0,
    activities: 0,
    shopping: 0,
    other: 0,
  };

  trip.expenses.forEach((e) => {
    if (categoryTotals[e.category] !== undefined) {
      categoryTotals[e.category] += Number(e.amount || 0);
    } else {
      categoryTotals.other += Number(e.amount || 0);
    }
  });

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc.trim() || amount <= 0) return;

    const newExpense: Expense = {
      id: `exp-${Date.now()}`,
      tripId: trip.id,
      category,
      description: desc.trim(),
      amount: Number(amount),
      currency: trip.currency,
      date,
      paidBy,
    };

    onUpdateTrip({
      ...trip,
      expenses: [newExpense, ...trip.expenses],
    });

    setDesc('');
    setAmount(50);
    setIsModalOpen(false);
  };

  const handleDeleteExpense = (expenseId: string) => {
    onUpdateTrip({
      ...trip,
      expenses: trip.expenses.filter((e) => e.id !== expenseId),
    });
  };

  const filteredExpenses =
    filterCategory === 'all'
      ? trip.expenses
      : trip.expenses.filter((e) => e.category === filterCategory);

  return (
    <div className="space-y-6 pb-24 md:pb-12">
      {/* Top 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Presupuesto Total */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#111918] border border-stone-200 dark:border-stone-800 shadow-sm">
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Presupuesto</span>
            <Wallet className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 font-mono">
            {trip.currency}{totalBudget.toLocaleString()}
          </div>
          <span className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 block">
            Nivel: <strong className="text-stone-700 dark:text-stone-300 capitalize">{trip.budgetTier}</strong>
          </span>
        </div>

        {/* Estimado Total (Actividades + Gastos) */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#111918] border border-stone-200 dark:border-stone-800 shadow-sm">
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Estimado</span>
            <PieChart className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 font-mono">
            {trip.currency}{totalEstimated.toLocaleString()}
          </div>
          <span className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 block">
            {trip.currency}{activitiesEstimatedSum} en actividades
          </span>
        </div>

        {/* Gastado Real */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#111918] border border-stone-200 dark:border-stone-800 shadow-sm">
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Gastado</span>
            <TrendingDown className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 font-mono">
            {trip.currency}{actualSpent.toLocaleString()}
          </div>
          <div className="w-full bg-stone-100 dark:bg-stone-800 h-1.5 rounded-full overflow-hidden mt-2.5">
            <div
              className={`h-1.5 transition-all duration-300 ${
                percentageSpent > 90
                  ? 'bg-rose-500'
                  : percentageSpent > 70
                  ? 'bg-amber-500'
                  : 'bg-emerald-600'
              }`}
              style={{ width: `${percentageSpent}%` }}
            />
          </div>
        </div>

        {/* Disponible */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#111918] border border-stone-200 dark:border-stone-800 shadow-sm">
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Disponible</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div
            className={`text-2xl sm:text-3xl font-extrabold font-mono ${
              remaining >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {trip.currency}{remaining.toLocaleString()}
          </div>
          <span className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 block">
            {remaining >= 0 ? 'Margen disponible' : 'Superaste el límite'}
          </span>
        </div>
      </div>

      {/* Category Breakdown Bars */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#111918] border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 font-serif">
            Distribución por Categorías
          </h3>
          <span className="text-xs font-medium text-stone-500">
            {trip.expenses.length} gastos contabilizados
          </span>
        </div>

        {/* Multi-segment Progress Bar */}
        <div className="w-full h-3 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden flex">
          {(Object.keys(categoryTotals) as ExpenseCategory[]).map((cat) => {
            const catSpent = categoryTotals[cat];
            if (catSpent === 0) return null;
            const pct = (catSpent / Math.max(1, actualSpent)) * 100;
            return (
              <div
                key={cat}
                style={{
                  width: `${pct}%`,
                  backgroundColor: CATEGORY_META[cat].color,
                }}
                title={`${CATEGORY_META[cat].label}: ${trip.currency}${catSpent}`}
              />
            );
          })}
        </div>

        {/* Category Pills Breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 pt-2">
          {(Object.keys(categoryTotals) as ExpenseCategory[]).map((cat) => {
            const catSpent = categoryTotals[cat];
            const meta = CATEGORY_META[cat];
            return (
              <div
                key={cat}
                className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-900/50 border border-stone-200/80 dark:border-stone-800"
              >
                <div className="flex items-center gap-1.5 text-xs text-stone-600 dark:text-stone-300 truncate">
                  <span>{meta.icon}</span>
                  <span className="truncate">{meta.label}</span>
                </div>
                <div className="text-sm font-bold text-stone-900 dark:text-stone-100 font-mono mt-1">
                  {trip.currency}{catSpent}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Expenses Table / List */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#111918] border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 font-serif">
              Registro de Gastos
            </h3>
            {/* Filter */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="text-xs font-medium px-2.5 py-1 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-800 dark:text-stone-200 focus:outline-none"
            >
              <option value="all">Todas las categorías</option>
              {(Object.keys(CATEGORY_META) as ExpenseCategory[]).map((k) => (
                <option key={k} value={k}>
                  {CATEGORY_META[k].icon} {CATEGORY_META[k].label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 transition-colors shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar gasto</span>
          </button>
        </div>

        {/* Table or Empty */}
        {filteredExpenses.length === 0 ? (
          <div className="py-12 text-center text-xs text-stone-500">
            No hay gastos registrados en esta categoría.
          </div>
        ) : (
          <div className="divide-y divide-stone-100 dark:divide-stone-800">
            {filteredExpenses.map((exp) => {
              const meta = CATEGORY_META[exp.category] || CATEGORY_META.other;
              return (
                <div
                  key={exp.id}
                  className="py-3.5 flex items-center justify-between gap-4 hover:bg-stone-50/60 dark:hover:bg-stone-900/30 px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-lg shrink-0">{meta.icon}</span>
                    <div className="min-w-0">
                      <span className="text-sm font-semibold text-stone-900 dark:text-stone-100 block truncate">
                        {exp.description}
                      </span>
                      <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
                        <span>{meta.label}</span>
                        <span>·</span>
                        <span>{exp.date}</span>
                        {exp.paidBy && (
                          <>
                            <span>·</span>
                            <span>{exp.paidBy}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100 font-mono">
                      {trip.currency}{exp.amount}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteExpense(exp.id)}
                      className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                      title="Eliminar gasto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111918] rounded-2xl sm:rounded-3xl p-6 max-w-md w-full border border-stone-200 dark:border-stone-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 font-serif">
                Registrar Nuevo Gasto
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Concepto / Descripción *
                </label>
                <input
                  type="text"
                  required
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Ej. Billetes de tren, Cena en Monti, Entrada museo..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Monto ({trip.currency}) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    required
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Categoría
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {(Object.keys(CATEGORY_META) as ExpenseCategory[]).map((k) => (
                      <option key={k} value={k}>
                        {CATEGORY_META[k].icon} {CATEGORY_META[k].label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Método de pago
                  </label>
                  <input
                    type="text"
                    value={paidBy}
                    onChange={(e) => setPaidBy(e.target.value)}
                    placeholder="Tarjeta, Efectivo..."
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
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
                  Guardar gasto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
