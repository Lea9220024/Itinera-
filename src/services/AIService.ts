import { GoogleGenAI } from '@google/genai';
import { AIActionProposal, Trip } from '../types';

export interface AIResponse {
  text: string;
  proposal?: AIActionProposal;
}

export class AIService {
  private static getClient(): GoogleGenAI | null {
    try {
      const apiKey =
        typeof process !== 'undefined' && process.env?.GEMINI_API_KEY
          ? process.env.GEMINI_API_KEY
          : (import.meta as any).env?.VITE_GEMINI_API_KEY;

      if (apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.length > 5) {
        return new GoogleGenAI({ apiKey });
      }
    } catch {}
    return null;
  }

  /**
   * Generates a context-aware assistant response for the user's query
   */
  static async askAssistant(query: string, currentTrip: Trip): Promise<AIResponse> {
    const qLower = query.toLowerCase().trim();
    const client = this.getClient();

    // Check if we can use real Gemini API
    if (client) {
      try {
        const tripContext = `
Viaje: ${currentTrip.name}
Destino: ${currentTrip.destination}
Fechas: ${currentTrip.startDate} a ${currentTrip.endDate} (${currentTrip.totalDays} días)
Viajeros: ${currentTrip.travelers.adults} adultos, ${currentTrip.travelers.children} niños (${currentTrip.travelers.profile || 'pareja'})
Presupuesto: ${currentTrip.currency}${currentTrip.budgetTotal} (${currentTrip.budgetTier})
Ritmo: ${currentTrip.pace}
Intereses: ${currentTrip.interests.join(', ')}
Días y actividades actuales:
${currentTrip.days
  .map(
    (d) =>
      `Día ${d.dayNumber} (${d.city}, ${d.date}): ${d.activities
        .map((a) => `${a.startTime} ${a.name} (${currentTrip.currency}${a.estimatedCost})`)
        .join(', ')}`
  )
  .join('\n')}
`;

        const systemInstruction = `
Eres el copiloto inteligente de viajes de Itinera. Hablas en español cordial, conciso y experto.
Tienes todo el contexto del viaje del usuario.
Si el usuario pide un cambio en el itinerario (agregar actividad, mover horario, eliminar, o reestructurar), debes responder con una explicación clara y si corresponde, proponer una acción concreta en formato JSON al final de tu respuesta precedida por "---ACTION_PROPOSAL---".
Formato del JSON de propuesta:
{
  "title": "Breve título de la acción",
  "description": "Explicación de qué cambiará",
  "type": "add_activity" | "move_activity" | "remove_activity" | "change_pace",
  "payload": { ... }
}
Si es solo una duda, recomendación gastronómica o plan de lluvia, responde de forma accionable y elegante sin propuesta.
`;

        const response = await client.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemInstruction}\n\nContexto del viaje:\n${tripContext}\n\nPregunta del usuario: ${query}` }],
            },
          ],
        });

        const outputText = response.text || '';
        if (outputText.includes('---ACTION_PROPOSAL---')) {
          const parts = outputText.split('---ACTION_PROPOSAL---');
          const cleanText = parts[0].trim();
          try {
            const rawJson = parts[1].trim().replace(/```json|```/g, '');
            const parsed = JSON.parse(rawJson);
            const proposal: AIActionProposal = {
              id: `prop-${Date.now()}`,
              title: parsed.title || 'Propuesta de ajuste',
              description: parsed.description || 'Modificación sugerida para tu itinerario.',
              type: parsed.type || 'add_activity',
              payload: parsed.payload || {},
            };
            return { text: cleanText, proposal };
          } catch (e) {
            return { text: cleanText };
          }
        }

        return { text: outputText };
      } catch (err) {
        console.warn('AIService: Gemini call failed or offline, falling back to smart local engine', err);
      }
    }

    // Smart Local Travel Knowledge Engine (offline & fast fallback)
    return this.generateLocalResponse(qLower, currentTrip);
  }

  private static generateLocalResponse(q: string, trip: Trip): AIResponse {
    // 1. Rainy day alternative
    if (q.includes('llueve') || q.includes('lluvia') || q.includes('clima')) {
      return {
        text: `Para días con lluvia en ${trip.destination.split('(')[0].trim() || 'tu destino'}, te recomiendo priorizar galerías cubiertas, palacios históricos y bistrós acogedores. Por ejemplo, en Roma visitar la Galería Borghese o las Termas de Diocleciano; o en Florencia pasar la tarde en el Bargello y las capillas Médici.`,
        proposal: {
          id: `prop-${Date.now()}`,
          title: 'Adaptar plan a clima lluvioso',
          description: 'Sustituir caminatas al aire libre por visita guiada a museo techado y cata de café.',
          type: 'add_activity',
          payload: {
            newActivity: {
              name: 'Visita cultural cubierta & Degustación',
              description: 'Alternativa bajo techo en caso de precipitaciones.',
              category: 'culture',
              startTime: '16:00',
              endTime: '18:00',
              durationMinutes: 120,
              estimatedCost: 25,
            },
          },
        },
      };
    }

    // 2. Budget reduction
    if (q.includes('gastar menos') || q.includes('presupuesto') || q.includes('barato') || q.includes('ahorrar')) {
      const avgFoodCost = 45;
      return {
        text: `Analizando tu viaje actual: tienes presupuestado un total de ${trip.currency}${trip.budgetTotal}. Puedes reducir hasta un 25% optando por mercados locales (como el Mercato Centrale o Trionfale para almorzar por ~${trip.currency}12 por persona), aprovechando las iglesias con arte gratuito de Caravaggio y adquiriendo pases de transporte ilimitado de 72 horas.`,
        proposal: {
          id: `prop-${Date.now()}`,
          title: 'Optimización de gastos en comidas y entradas',
          description: `Sustituir almuerzo de restaurante por puestos gourmet tradicionales (~ahorro de ${trip.currency}${avgFoodCost}).`,
          type: 'change_pace',
          payload: {
            newPace: 'balanced',
          },
        },
      };
    }

    // 3. Free time / relax
    if (q.includes('tiempo libre') || q.includes('descanso') || q.includes('relax') || q.includes('menos actividades')) {
      return {
        text: `¡Excelente idea! Un viaje memorable necesita momentos de contemplación para sentarse en una plaza con un aperitivo y ver pasar la vida sin prisas. He preparado una propuesta para despejar la tarde y adelantar el tiempo libre.`,
        proposal: {
          id: `prop-${Date.now()}`,
          title: 'Liberar bloque de 3 horas de tiempo libre',
          description: 'Reorganizar la agenda para disponer de la tarde libre sin visitas programadas.',
          type: 'change_pace',
          payload: {
            newPace: 'relax',
          },
        },
      };
    }

    // 4. Nearby recommendations (Colosseum, Duomo, etc.)
    if (q.includes('coliseo') || q.includes('cerca')) {
      return {
        text: `Muy cerca del Coliseo te recomiendo:\n1. Pasear por el encantador Rione Monti (Via Urbana y Via Panisperna), lleno de cafés de especialidad y tiendas vintage.\n2. Visitar San Pietro in Vincoli para admirar el Moisés de Miguel Ángel (entrada gratuita).\n3. Relajarte en los jardines de Colle Oppio con vistas directas a los arcos del anfiteatro.`,
        proposal: {
          id: `prop-${Date.now()}`,
          title: 'Agregar parada en San Pietro in Vincoli (Moisés de Miguel Ángel)',
          description: 'A 6 minutos a pie del Coliseo. Visita de 40 minutos sin coste de entrada.',
          type: 'add_activity',
          payload: {
            newActivity: {
              name: 'San Pietro in Vincoli (Moisés de Miguel Ángel)',
              description: 'Basílica renacentista con la colosal escultura del Moisés tallada por Miguel Ángel.',
              category: 'culture',
              startTime: '13:00',
              endTime: '13:45',
              durationMinutes: 45,
              location: 'Piazza di San Pietro in Vincoli 4a, Roma',
              latitude: 41.8939,
              longitude: 12.4931,
              estimatedCost: 0,
              currency: trip.currency,
            },
          },
        },
      };
    }

    // 5. Beach or nature day
    if (q.includes('playa') || q.includes('mar') || q.includes('costa')) {
      return {
        text: `Si deseas sumar una jornada de mar a tu escapada, la opción más idílica y accesible desde Florencia o Roma es una excursión a Cinque Terre o a la Costa de Amalfi / Santa Marinella. Puedes tomar un tren matutino y regresar para cenar.`,
        proposal: {
          id: `prop-${Date.now()}`,
          title: 'Añadir tarde de costa y aperitivo marino',
          description: 'Ajustar la jornada para incluir paseo marítimo y brisa marina.',
          type: 'add_activity',
          payload: {
            newActivity: {
              name: 'Tarde de costa y paseo marítimo',
              description: 'Paseo frente al mar, baño refrescante y aperitivo con vistas.',
              category: 'relaxation',
              startTime: '15:00',
              endTime: '18:30',
              durationMinutes: 210,
              estimatedCost: 35,
              currency: trip.currency,
            },
          },
        },
      };
    }

    // Default helpful response
    return {
      text: `Entendido. En base a tu viaje a ${trip.destination} (${trip.totalDays} días, estilo ${trip.pace}), todo el itinerario está coordinado para maximizar tu experiencia con un presupuesto de ${trip.currency}${trip.budgetTotal}. Puedes pedirme sugerencias de restaurantes locales, ajustes en los horarios de las actividades o consejos de equipaje.`,
    };
  }
}
