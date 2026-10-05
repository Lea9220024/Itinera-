import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // 1. Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 2. Validate User Authentication (JWT) if present
    const authHeader = req.headers.get('Authorization');
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';

    let authenticatedUserId: string | null = null;
    if (authHeader && supabaseUrl && supabaseAnonKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
          global: { headers: { Authorization: authHeader } },
        });
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          authenticatedUserId = user.id;
        }
      } catch (authErr) {
        console.warn('ai-assistant: Auth token verification skipped or failed', authErr);
      }
    }

    // 3. Parse and Sanitize Input
    const body = await req.json().catch(() => ({}));
    const { query, context } = body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Parámetro query es requerido y debe ser una cadena no vacía.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Input sanitization: truncate to 1000 characters to prevent prompt bloat
    const sanitizedQuery = query.trim().slice(0, 1000).replace(/[<>]/g, ' ');

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'GEMINI_API_KEY no está configurada en los secrets del servidor.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. System Prompt Enforcing Strict Structured Schema
    const systemPrompt = `
Eres el copiloto inteligente de viajes de Itinera. Hablas en español cordial, conciso y profesional.
Tu trabajo es responder a la consulta del usuario utilizando el contexto mínimo del viaje proporcionado.
Debes devolver OBLIGATORIAMENTE un JSON estructurado con este esquema exacto:
{
  "message": "Texto en prosa para el usuario explicando tu respuesta o consejo",
  "action": "NONE" | "ADD_ACTIVITY" | "MOVE_ACTIVITY" | "DELETE_ACTIVITY" | "UPDATE_ACTIVITY" | "ADD_DAY" | "REMOVE_DAY" | "OPTIMIZE_DAY" | "UPDATE_BUDGET",
  "title": "Breve título de la propuesta (requerido si action != 'NONE')",
  "description": "Qué cambiará en el itinerario",
  "payload": {
    "targetDayId": "opcional, id del día donde insertar",
    "activityId": "opcional, id de la actividad si es move/delete",
    "sourceDayId": "opcional, id del día origen si es move",
    "newActivity": {
      "name": "Nombre",
      "description": "Descripción concisa",
      "category": "culture" | "gastronomy" | "sightseeing" | "relaxation" | "adventure" | "shopping" | "transport" | "lodging",
      "startTime": "HH:MM",
      "endTime": "HH:MM",
      "durationMinutes": 90,
      "location": "Ubicación sugerida",
      "estimatedCost": 20
    },
    "newBudget": 2000
  }
}
Si el usuario hace solo una pregunta informativa o gastronómica sin solicitar cambios en la agenda, pon action: "NONE".
La IA propone y el usuario confirmará en la interfaz. NUNCA asumas que los cambios ya fueron ejecutados.
`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const geminiPayload = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `${systemPrompt}\n\nContexto del viaje:\n${JSON.stringify(
                context || {}
              )}\n\nConsulta del usuario:\n${sanitizedQuery}`,
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
      body: JSON.stringify(geminiPayload),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      throw new Error(`Gemini API error status ${geminiRes.status}: ${errText}`);
    }

    const geminiData = await geminiRes.json();
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    
    let parsed: any;
    try {
      parsed = JSON.parse(rawText || '{}');
    } catch {
      parsed = {
        message: 'Disculpa, no pude procesar la propuesta en formato válido.',
        action: 'NONE',
        payload: {},
      };
    }

    // Default safety checks on structured fields
    if (!parsed.message) {
      parsed.message = 'Respuesta generada por el asistente de Itinera.';
    }
    if (!parsed.action) {
      parsed.action = 'NONE';
    }

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('ai-assistant error:', error);
    return new Response(
      JSON.stringify({
        message: 'No fue posible completar la consulta con el asistente.',
        action: 'NONE',
        error: error.message || 'Error interno en Edge Function de IA',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
