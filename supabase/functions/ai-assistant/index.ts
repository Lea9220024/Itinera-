import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { query, context } = await req.json();

    if (!query || typeof query !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Parámetro query es requerido y debe ser texto.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'GEMINI_API_KEY no está configurada en el servidor.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = `
Eres el copiloto inteligente de viajes de Itinera. Hablas en español cordial, conciso y profesional.
Tu trabajo es responder a la consulta del usuario utilizando el contexto mínimo del viaje proporcionado.
Debes devolver OBLIGATORIAMENTE un JSON estructurado con este esquema exacto:
{
  "message": "Texto en prosa para el usuario explicando tu respuesta o consejo",
  "action": "NONE" | "ADD_ACTIVITY" | "MOVE_ACTIVITY" | "DELETE_ACTIVITY" | "UPDATE_ACTIVITY" | "ADD_DAY" | "REMOVE_DAY" | "OPTIMIZE_DAY" | "UPDATE_BUDGET",
  "title": "Breve título de la acción (si action != 'NONE')",
  "description": "Qué cambiará en el itinerario",
  "payload": {
    "targetDayId": "opcional, id del día donde insertar",
    "activityId": "opcional, id de la actividad si es move/delete",
    "newActivity": {
      "name": "Nombre",
      "description": "Descripción",
      "category": "culture|gastronomy|sightseeing|relaxation|adventure|shopping|transport|lodging",
      "startTime": "HH:MM",
      "endTime": "HH:MM",
      "durationMinutes": 90,
      "location": "Ubicación",
      "estimatedCost": 20
    }
  }
}
Si el usuario hace solo una pregunta informativa o gastronómica sin solicitar cambios en la agenda, pon action: "NONE".
`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`;

    const payload = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `${systemPrompt}\n\nContexto del viaje:\n${JSON.stringify(
                context
              )}\n\nPregunta del usuario:\n${query}`,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    };

    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      throw new Error(`Gemini API error: ${errText}`);
    }

    const geminiData = await geminiRes.json();
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = JSON.parse(rawText);

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || 'Error en Edge Function de IA' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
