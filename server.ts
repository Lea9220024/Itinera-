import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Server-side AI Assistant endpoint (Protects GEMINI_API_KEY from ever leaking to client)
app.post('/api/ai-assistant', async (req, res) => {
  try {
    const { query, context } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'La consulta es requerida.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      return res.status(503).json({
        error: 'GEMINI_API_KEY no configurada en el servidor. Usando motor local de respaldo.',
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `
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
      "name": "Nombre de la actividad",
      "description": "Detalles breves",
      "category": "culture" | "gastronomy" | "sightseeing" | "relaxation" | "adventure" | "shopping" | "transport" | "lodging",
      "startTime": "HH:MM",
      "endTime": "HH:MM",
      "durationMinutes": 90,
      "location": "Ubicación sugerida",
      "estimatedCost": 25
    },
    "newBudget": 2000
  }
}
Si el usuario hace solo una consulta informativa o gastronómica sin solicitar cambios en la agenda, pon action: "NONE".
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `${systemInstruction}\n\nContexto del viaje:\n${JSON.stringify(
                context
              )}\n\nConsulta del usuario:\n${query}`,
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const outputText = response.text || '{}';
    const parsed = JSON.parse(outputText);
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/ai-assistant:', error);
    return res.status(500).json({
      error: error.message || 'Error al procesar la solicitud de IA.',
    });
  }
});

// Vite Middleware for development & Static serving for production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer();
