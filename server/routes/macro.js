const express = require('express');
const fetch = require('node-fetch');
const Anthropic = require('@anthropic-ai/sdk');
const router = express.Router();

const FRED_BASE = 'https://api.stlouisfed.org/fred/series/observations';

async function fetchSeries(seriesId, limit = 1) {
  const url = `${FRED_BASE}?series_id=${seriesId}&api_key=${process.env.FRED_API_KEY}&file_type=json&sort_order=desc&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`FRED error for ${seriesId}: ${res.status}`);
  const data = await res.json();
  return data.observations;
}

// Key macro indicators
router.get('/indicators', async (req, res) => {
  try {
    const series = {
      STLFSI4: 'Financial Stress Index',
      UNRATE: 'Unemployment Rate',
      CPIAUCSL: 'CPI (All Urban)',
      DGS10: '10Y Treasury Yield',
      BAMLH0A0HYM2: 'HY Credit Spread',
      FEDFUNDS: 'Fed Funds Rate',
    };

    const results = await Promise.all(
      Object.entries(series).map(async ([id, label]) => {
        const obs = await fetchSeries(id, 2);
        const latest = obs[0];
        const prev = obs[1];
        const value = parseFloat(latest.value);
        const prevValue = parseFloat(prev?.value);
        return {
          id,
          label,
          value: isNaN(value) ? null : value,
          date: latest.date,
          change: !isNaN(value) && !isNaN(prevValue) ? value - prevValue : null,
        };
      })
    );

    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Yield curve
router.get('/yield-curve', async (req, res) => {
  try {
    const maturities = [
      { id: 'DGS1MO', label: '1M' },
      { id: 'DGS3MO', label: '3M' },
      { id: 'DGS6MO', label: '6M' },
      { id: 'DGS1', label: '1Y' },
      { id: 'DGS2', label: '2Y' },
      { id: 'DGS3', label: '3Y' },
      { id: 'DGS5', label: '5Y' },
      { id: 'DGS7', label: '7Y' },
      { id: 'DGS10', label: '10Y' },
      { id: 'DGS20', label: '20Y' },
      { id: 'DGS30', label: '30Y' },
    ];

    const results = await Promise.all(
      maturities.map(async ({ id, label }) => {
        const obs = await fetchSeries(id, 1);
        return { label, yield: parseFloat(obs[0].value), date: obs[0].date };
      })
    );

    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Macro regime summariser
router.post('/regime', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'text is required' });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(503).json({ error: 'ANTHROPIC_API_KEY not configured' });
  try {
    const client = new Anthropic();
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      messages: [{
        role: 'user',
        content: `You are a macro strategist. Summarise the following text into a concise regime assessment for an L/S equity options desk with a 1-4 month horizon. Cover: current regime label, key risks, and what it means for equity volatility and positioning. Be direct and dense — no filler.\n\n${text}`,
      }],
    });
    const summary = message.content.find((b) => b.type === 'text')?.text || '';
    res.json({ summary });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
