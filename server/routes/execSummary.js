const express = require('express');
const multer = require('multer');
const mammoth = require('mammoth');
const pdf = require('pdf-parse');
const Anthropic = require('@anthropic-ai/sdk');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const SYSTEM_PROMPT = `You are a senior analyst at an L/S equity options desk. Summarise the document provided into structured JSON.
Return ONLY valid JSON with this shape:
{
  "title": string,
  "thesis": string (2-3 sentences, the core investment view),
  "keyPoints": string[] (5-7 bullets),
  "scenarios": [{ "label": string, "probability": number, "priceTarget": string, "rationale": string }],
  "risks": string[],
  "catalysts": string[],
  "timeHorizon": string,
  "recommendation": "BUY" | "SELL" | "HOLD" | "NEUTRAL"
}`;

router.post('/', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    let text = '';
    const mime = req.file.mimetype;

    if (mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ buffer: req.file.buffer });
      text = result.value;
    } else if (mime === 'application/pdf') {
      const result = await pdf(req.file.buffer);
      text = result.text;
    } else {
      return res.status(400).json({ error: 'Unsupported file type. Upload .docx or .pdf' });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(503).json({ error: 'ANTHROPIC_API_KEY not configured' });
    }

    const client = new Anthropic();
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `Summarise this document:\n\n${text.slice(0, 50000)}` }],
    });

    const raw = message.content[0].text;
    let summary;
    try {
      summary = JSON.parse(raw);
    } catch {
      summary = { raw };
    }

    res.json({ summary, filename: req.file.originalname });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
