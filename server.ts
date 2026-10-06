import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { handleConsultation, ConsultationRequest } from './server/geminiHandler.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'LAKONAN AI Server',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Gemini Consultation Endpoint
app.post('/api/consultation', async (req: Request, res: Response) => {
  try {
    const { stageId, stageName, message } = req.body;
    if (!stageId || !stageName || !message) {
      res.status(400).json({ error: 'Parameter stageId, stageName, dan message wajib disertakan.' });
      return;
    }

    const reply = await handleConsultation(req.body as ConsultationRequest);
    res.json({ reply });
  } catch (error: any) {
    console.error('LAKONAN AI Consultation Error:', error);
    res.status(500).json({
      error: error?.message || 'Terjadi kesalahan saat memproses konsultasi dengan LAKONAN AI.',
    });
  }
});

// Serve frontend build in production
const distPath = path.resolve(__dirname, 'dist');
app.use(express.static(distPath));

app.get('*', (_req: Request, res: Response) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`LAKONAN AI Server running on port ${PORT}`);
});

export default app;
