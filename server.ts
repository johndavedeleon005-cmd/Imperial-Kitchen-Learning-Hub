import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize GoogleGenAI server-side with User-Agent header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Endpoint for Gemini 3.8 Flash TTS
app.post('/api/tts', async (req, res) => {
  try {
    const { text, voice = 'Kore', style } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required for TTS' });
    }

    // Limit text chunk to reasonable length for optimal voice synthesis
    const trimmedText = text.trim().slice(0, 2500);

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: trimmedText,
              speechMetadata: {
                style: style || 'Clear, professional, and reassuring food safety compliance auditor',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: ['Kore', 'Puck', 'Fenrir', 'Zephyr', 'Charon'].includes(voice) ? voice : 'Kore',
            },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error('No audio data received from Gemini TTS model');
    }

    return res.json({
      audio: base64Audio,
      mimeType: 'audio/wav',
    });
  } catch (error: any) {
    console.error('Error generating TTS:', error);
    return res.status(500).json({
      error: error.message || 'Failed to generate speech with Gemini TTS',
    });
  }
});

// Endpoint for Compliance Q&A Assistant using gemini-3.8-flash
app.post('/api/compliance-assistant', async (req, res) => {
  try {
    const { question, contextDocTitle, contextDocContent } = req.body;
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'Question is required' });
    }

    const prompt = `You are the Imperial Kitchen Group Inc. (Jiangnan Hotpot) Food Safety & Compliance Intelligence Assistant.
Your duty is to assist restaurant, kitchen, warehouse, and service staff with fast, accurate, and actionable compliance guidance.
Base your answer on Philippine Food Safety Act of 2013 (RA 10611), Code on Sanitation of the Philippines (PD 856), and company policies (IKQAP#001 to #021 and IKQA-SOP#010).

${contextDocTitle ? `Current Document Being Viewed: ${contextDocTitle}` : ''}
${contextDocContent ? `Document Excerpt/Context:\n${contextDocContent.slice(0, 3000)}` : ''}

Staff Query:
${question}

Instructions:
1. Provide a direct, practical, and clear response in bullet points or short paragraphs.
2. Highlight critical control numbers (temperatures like 4°C, 5°C, 60°C, 74°C, 15-minute cold chain rule, Big 9 allergens, towel/board color codes).
3. If applicable, cite the relevant policy document number (e.g. IKQAP#003 for Cold Chain, IKQAP#015 for Towels, IKQA-SOP#010 for Cross-Contamination).
4. Emphasize corrective actions if an infraction or spill occurred.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    return res.json({
      answer: response.text || 'No response generated.',
    });
  } catch (error: any) {
    console.error('Error in compliance assistant:', error);
    return res.status(500).json({
      error: error.message || 'Failed to get answer from compliance assistant',
    });
  }
});

// Serve Vite in dev or static files in production
if (process.env.NODE_ENV !== 'production') {
  const { createServer } = await import('vite');
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Food Safety Compliance app listening on http://0.0.0.0:${PORT}`);
});
