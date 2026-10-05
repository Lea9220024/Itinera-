import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Send,
  Sparkles,
  Bot,
  User,
  CheckCircle,
  XCircle,
  HelpCircle,
  Compass,
  ArrowRight,
} from 'lucide-react';
import { Trip, ChatMessage, AIActionProposal, Activity } from '../../types';
import { AIService } from '../../services/AIService';

interface AIChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip;
  onUpdateTrip: (updated: Trip) => void;
}

const QUICK_PROMPTS = [
  '¿Qué puedo hacer mañana si llueve?',
  'Quiero gastar menos',
  '¿Qué puedo hacer cerca del Coliseo?',
  'Quiero más tiempo libre',
  'Añadir un paseo de playa o costa',
];

export const AIChatDrawer: React.FC<AIChatDrawerProps> = ({
  isOpen,
  onClose,
  trip,
  onUpdateTrip,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'assistant',
      text: `¡Hola! Soy tu asistente de viaje para ${trip.name}. Conozco tus ${trip.totalDays} días planificados, tus ciudades (${trip.destinationsList.join(', ')}) y tu presupuesto de ${trip.currency}${trip.budgetTotal}. ¿En qué te puedo asesorar hoy?`,
      timestamp: 'Ahora',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [proposalStatus, setProposalStatus] = useState<Record<string, 'accepted' | 'declined'>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await AIService.askAssistant(text, trip);

      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'assistant',
        text: response.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        proposal: response.proposal,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now() + 1}`,
          sender: 'assistant',
          text: 'Disculpa, no pude procesar la consulta en este momento. Inténtalo de nuevo.',
          timestamp: 'Ahora',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptProposal = (proposal: AIActionProposal) => {
    setProposalStatus((prev) => ({ ...prev, [proposal.id]: 'accepted' }));

    if (proposal.type === 'ADD_ACTIVITY' && proposal.payload.newActivity) {
      const act = proposal.payload.newActivity;
      const targetDayId = proposal.payload.targetDayId || trip.days[0]?.id || 'day-1';

      const newAct: Activity = {
        id: `act-ai-${Date.now()}`,
        dayId: targetDayId,
        name: act.name || 'Nueva Actividad',
        description: act.description || '',
        category: (act.category as any) || 'culture',
        startTime: act.startTime || '16:00',
        endTime: act.endTime || '18:00',
        durationMinutes: act.durationMinutes || 120,
        location: act.location || trip.destination,
        latitude: act.latitude || 41.8939,
        longitude: act.longitude || 12.4931,
        estimatedCost: act.estimatedCost || 0,
        currency: trip.currency,
        completed: false,
      };

      const updatedDays = trip.days.map((day) => {
        if (day.id === targetDayId) {
          const updatedActs = [...day.activities, newAct].sort((a, b) =>
            a.startTime.localeCompare(b.startTime)
          );
          return { ...day, activities: updatedActs };
        }
        return day;
      });

      onUpdateTrip({ ...trip, days: updatedDays });
    } else if (proposal.type === 'UPDATE_BUDGET' && proposal.payload.newBudget) {
      onUpdateTrip({ ...trip, budgetTotal: Number(proposal.payload.newBudget) });
    } else if (proposal.type === 'DELETE_ACTIVITY' && proposal.payload.activityId) {
      const updatedDays = trip.days.map((day) => ({
        ...day,
        activities: day.activities.filter((a) => a.id !== proposal.payload.activityId),
      }));
      onUpdateTrip({ ...trip, days: updatedDays });
    } else if (proposal.type === 'MOVE_ACTIVITY' && proposal.payload.activityId && proposal.payload.targetDayId) {
      const targetDayId = proposal.payload.targetDayId;
      let movedActivity: Activity | null = null;
      const daysWithoutAct = trip.days.map((day) => {
        const found = day.activities.find((a) => a.id === proposal.payload.activityId);
        if (found) {
          movedActivity = { ...found, dayId: targetDayId };
          return { ...day, activities: day.activities.filter((a) => a.id !== proposal.payload.activityId) };
        }
        return day;
      });

      if (movedActivity) {
        const actToAdd: Activity = movedActivity;
        const finalDays = daysWithoutAct.map((day) => {
          if (day.id === targetDayId) {
            return {
              ...day,
              activities: [...day.activities, actToAdd].sort((a, b) => a.startTime.localeCompare(b.startTime)),
            };
          }
          return day;
        });
        onUpdateTrip({ ...trip, days: finalDays });
      }
    } else if (proposal.type === 'OPTIMIZE_DAY' && proposal.payload.targetDayId) {
      const updatedDays = trip.days.map((day) => {
        if (day.id === proposal.payload.targetDayId) {
          return {
            ...day,
            activities: [...day.activities].sort((a, b) => a.startTime.localeCompare(b.startTime)),
          };
        }
        return day;
      });
      onUpdateTrip({ ...trip, days: updatedDays });
    }
  };

  const handleDeclineProposal = (proposalId: string) => {
    setProposalStatus((prev) => ({ ...prev, [proposalId]: 'declined' }));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white dark:bg-[#111918] h-full shadow-2xl border-l border-stone-200 dark:border-stone-800 flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-emerald-50/50 dark:bg-emerald-950/20">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-sm">
              <Sparkles className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 font-serif">
                Asistente de Viaje
              </h3>
              <span className="text-[11px] text-stone-500 dark:text-stone-400 block truncate max-w-[220px]">
                {trip.destination} · Contexto activo
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick prompt suggestions */}
        <div className="p-3 border-b border-stone-100 dark:border-stone-800/80 bg-stone-50/60 dark:bg-stone-900/30 overflow-x-auto scrollbar-none flex items-center gap-2">
          {QUICK_PROMPTS.map((prompt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSendMessage(prompt)}
              className="flex-shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:border-emerald-500/50 transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Message Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            const proposal = msg.proposal;
            const status = proposal ? proposalStatus[proposal.id] : undefined;

            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-lg bg-emerald-700 text-white flex items-center justify-center text-xs shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                  </div>
                )}

                <div className={`space-y-2 max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
                  {/* Bubble */}
                  <div
                    className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      isUser
                        ? 'bg-emerald-700 text-white rounded-tr-xs shadow-sm'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 rounded-tl-xs'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>
                  </div>

                  {/* Proposal Card if present */}
                  {proposal && (
                    <div className="p-3.5 rounded-2xl border border-emerald-500/40 bg-emerald-50/60 dark:bg-emerald-950/40 space-y-2.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 dark:text-emerald-200">
                        <Compass className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Propuesta para tu itinerario</span>
                      </div>
                      <h5 className="text-xs font-bold text-stone-900 dark:text-stone-100">
                        {proposal.title}
                      </h5>
                      <p className="text-[11px] text-stone-600 dark:text-stone-300">
                        {proposal.description}
                      </p>

                      {status === 'accepted' ? (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-semibold pt-1">
                          <CheckCircle className="w-4 h-4" />
                          <span>¡Propuesta aplicada al itinerario!</span>
                        </div>
                      ) : status === 'declined' ? (
                        <div className="flex items-center gap-1.5 text-xs text-stone-500 font-medium pt-1">
                          <XCircle className="w-4 h-4" />
                          <span>Propuesta descartada</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleAcceptProposal(proposal)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 transition-colors shadow-xs"
                          >
                            ACEPTAR
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeclineProposal(proposal.id)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors"
                          >
                            CANCELAR
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <span className="text-[10px] text-stone-400 block px-1">
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 items-center text-xs text-stone-500 italic">
              <div className="w-7 h-7 rounded-lg bg-emerald-700 text-white flex items-center justify-center shrink-0 animate-spin">
                <Compass className="w-3.5 h-3.5" />
              </div>
              <span>Analizando el viaje y redactando respuesta...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-[#111918]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu consulta o pide un cambio..."
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="w-10 h-10 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white flex items-center justify-center transition-colors shrink-0 shadow-xs"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
