import { AIActionProposal, AIActionType, Trip, UserPreferences } from '../types';
import { TripContextBuilder } from './TripContextBuilder';
import { AIActionValidator } from './AIActionValidator';
import { supabase, isSupabaseConfigured } from '../lib/supabase/client';

export interface AIResponse {
  text: string;
  proposal?: AIActionProposal;
}

export class AIService {
  /**
   * Generates a context-aware assistant response.
   * Priority:
   * 1. Official Supabase Edge Function ('ai-assistant') with user JWT & CORS validation.
   * 2. Deterministic local domain reasoning engine (Zero API key exposed) for offline/demo mode.
   */
  static async askAssistant(
    query: string,
    currentTrip: Trip,
    preferences?: UserPreferences
  ): Promise<AIResponse> {
    const minimalContext = TripContextBuilder.build(currentTrip, preferences);

    // 1. Primary Official Path: Supabase Edge Function via supabase.functions.invoke
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.functions.invoke('ai-assistant', {
          body: {
            query,
            context: minimalContext,
          },
        });

        if (!error && data) {
          const validated = AIActionValidator.validateResponse(data);
          let proposal: AIActionProposal | undefined = undefined;

          if (validated.action !== 'NONE') {
            const actionCheck = AIActionValidator.validateActionProposal(
              validated.action,
              validated.payload
            );

            if (actionCheck.valid) {
              proposal = {
                id: `prop-${Date.now()}`,
                title: validated.title || 'Propuesta de ajuste en itinerario',
                description: validated.description || 'Modificación recomendada por el asistente.',
                type: validated.action as AIActionType,
                payload: actionCheck.cleanPayload || validated.payload,
              };
            }
          }

          return {
            text: validated.message,
            proposal,
          };
        }
      } catch (edgeErr) {
        console.warn('AIService: Supabase Edge Function invoke failed, trying fallback:', edgeErr);
      }
    }

    // Offline / unavailable fallback. Production never routes through a second AI backend.\n    // Local deterministic fallback (Zero API key exposed)
    return this.generateLocalFallback(query.toLowerCase().trim(), currentTrip);
  }

  /**
   * Deterministic local domain reasoning engine with structured action generation
   */
  private static generateLocalFallback(q: string, trip: Trip): AIResponse {
    const targetDayId = trip.days[0]?.id || 'day-1';

    // 1. Rainy day recommendation
    if (q.includes('llueve') || q.includes('lluvia') || q.includes('clima')) {
      return {
        text: `Para días con precipitaciones en ${trip.destination.split('(')[0].trim() || 'tu destino'}, te recomiendo priorizar galerías cubiertas, palacios históricos y cafeterías acogedoras. Por ejemplo, visitar museos techados y disfrutar de una cata gastronómica bajo techo.`,
        proposal: {
          id: `prop-${Date.now()}`,
          title: 'Adaptar plan a clima lluvioso',
          description: 'Sustituir caminatas al aire libre por visita guiada a museo techado y degustación artesanal.',
          type: 'ADD_ACTIVITY',
          payload: {
            targetDayId,
            newActivity: {
              name: 'Visita cultural cubierta & Degustación',
              description: 'Alternativa bajo techo con obras maestras y café de especialidad.',
              category: 'culture',
              startTime: '16:00',
              endTime: '18:00',
              durationMinutes: 120,
              location: 'Galería de arte central',
              estimatedCost: 25,
            },
          },
        },
      };
    }

    // 2. Budget reduction
    if (q.includes('gastar menos') || q.includes('presupuesto') || q.includes('barato') || q.includes('ahorrar')) {
      const suggestedBudget = Math.round(trip.budgetTotal * 0.85);
      return {
        text: `Actualmente tienes un presupuesto total de ${trip.currency}${trip.budgetTotal}. Puedes reducir hasta un 15% aprovechando mercados de comida callejera gourmet y adquiriendo pases de transporte de 72 horas.`,
        proposal: {
          id: `prop-${Date.now()}`,
          title: 'Optimización de presupuesto total',
          description: `Ajustar el presupuesto planificado a ${trip.currency}${suggestedBudget} para optimizar el gasto diario.`,
          type: 'UPDATE_BUDGET',
          payload: {
            newBudget: suggestedBudget,
          },
        },
      };
    }

    // 3. Relax / Free time
    if (q.includes('tiempo libre') || q.includes('descanso') || q.includes('relax') || q.includes('menos actividades')) {
      return {
        text: `Un viaje memorable necesita momentos de contemplación para sentarse en una plaza con un aperitivo y ver pasar la vida sin prisas. He preparado una propuesta para liberar la tarde.`,
        proposal: {
          id: `prop-${Date.now()}`,
          title: 'Añadir bloque de tiempo libre y relax',
          description: 'Despejar la tarde para pasear sin horario fijo.',
          type: 'ADD_ACTIVITY',
          payload: {
            targetDayId,
            newActivity: {
              name: 'Tarde libre de descanso y paseo contemplativo',
              description: 'Tiempo libre para pasear a tu propio ritmo, descansar o leer.',
              category: 'relaxation',
              startTime: '16:30',
              endTime: '18:30',
              durationMinutes: 120,
              location: 'Plaza o parque central',
              estimatedCost: 0,
            },
          },
        },
      };
    }

    // 4. Colosseum / Landmarks nearby
    if (q.includes('coliseo') || q.includes('cerca')) {
      return {
        text: `Muy cerca del Coliseo te recomiendo visitar la Basílica de San Pietro in Vincoli para admirar el célebre Moisés de Miguel Ángel (a 6 minutos a pie, sin coste de entrada) y luego pasear por el Rione Monti.`,
        proposal: {
          id: `prop-${Date.now()}`,
          title: 'Agregar parada en San Pietro in Vincoli (Moisés de Miguel Ángel)',
          description: 'A 6 minutos a pie del Coliseo. Visita de 45 minutos.',
          type: 'ADD_ACTIVITY',
          payload: {
            targetDayId,
            newActivity: {
              name: 'San Pietro in Vincoli (Moisés de Miguel Ángel)',
              description: 'Basílica renacentista con la colosal escultura del Moisés tallada por Miguel Ángel.',
              category: 'culture',
              startTime: '13:00',
              endTime: '13:45',
              durationMinutes: 45,
              location: 'Piazza di San Pietro in Vincoli 4a, Roma',
              estimatedCost: 0,
            },
          },
        },
      };
    }

    // Default conversational response
    return {
      text: `En base a tu viaje a ${trip.destination} (${trip.totalDays} días, estilo ${trip.pace}), todo el itinerario está coordinado para maximizar tu experiencia con un presupuesto de ${trip.currency}${trip.budgetTotal}. Puedes pedirme sugerencias de actividades, planes si llueve, optimizaciones de gastos o agregar nuevos lugares.`,
      proposal: undefined,
    };
  }
}
