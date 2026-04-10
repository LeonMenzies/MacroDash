const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const router = express.Router();

const EPICS = {
  latent: {
    label: 'Latent Catalysts',
    prompt: (ticker) => `For ${ticker}, identify idiosyncratic events and price catalysts from the last 6 months. Include:
- Key events and their price reactions (% move)
- Estimate revisions (EPS, revenue)
- Positioning changes or notable flows
- Short interest changes
Return as structured JSON: { "events": [{ "date": string, "event": string, "priceReaction": string, "notes": string }], "estimateRevisions": [{ "date": string, "metric": string, "change": string }], "summary": string }`,
  },
  definitive: {
    label: 'Definitive Calendar',
    prompt: (ticker) => `For ${ticker}, provide the hard-date event calendar. Include:
- Next earnings date (confirmed or estimated), guidance, consensus EPS/revenue
- Last 4 earnings: reported vs consensus, implied move vs actual move
- Upcoming ex-dividend dates, investor days, analyst days, share buyback windows
Return as JSON: { "nextEarnings": { "date": string, "epsConsensus": string, "revenueConsensus": string, "impliedMove": string }, "earningsHistory": [{ "date": string, "epsActual": string, "epsConsensus": string, "impliedMove": string, "actualMove": string }], "upcomingEvents": [{ "date": string, "event": string }] }`,
  },
  horizon: {
    label: 'Horizon Pipeline',
    prompt: (ticker) => `For ${ticker}, identify soft-date and pipeline catalysts over the next 1-4 months. For each, assign a confidence: CONFIRMED, EXPECTED, or RUMORED. Include:
- Product launches, regulatory decisions (FDA, FTC, etc.)
- M&A rumours, strategic reviews, spin-off speculation
- Management changes, activist involvement
- Macro events specifically relevant to this ticker
Return as JSON: { "catalysts": [{ "event": string, "expectedTiming": string, "confidence": "CONFIRMED"|"EXPECTED"|"RUMORED", "bullCase": string, "bearCase": string, "estimatedMagnitude": string }] }`,
  },
  macro: {
    label: 'Macro Overlay',
    prompt: (ticker) => `For ${ticker}, analyse macro sensitivities relevant to a 1-4 month trading horizon. Include:
- Key macro factors (rates, FX, commodities, credit spreads) and historical beta to each
- Current macro regime assessment and what it means for this ticker
- How the stock typically behaves in risk-on vs risk-off environments
- Any sector-specific macro tailwinds or headwinds right now
Return as JSON: { "sensitivities": [{ "factor": string, "direction": "positive"|"negative"|"mixed", "beta": string, "notes": string }], "regimeAssessment": string, "riskOn": string, "riskOff": string }`,
  },
};

router.get('/:ticker', async (req, res) => {
  const ticker = req.params.ticker.toUpperCase();
  const epic = req.query.epic;

  if (!EPICS[epic]) {
    return res.status(400).json({ error: `Unknown epic. Choose from: ${Object.keys(EPICS).join(', ')}` });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: 'ANTHROPIC_API_KEY not configured' });
  }

  try {
    const client = new Anthropic();
    const { prompt } = EPICS[epic];

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 5 }],
      messages: [{ role: 'user', content: prompt(ticker) }],
    });

    const textBlock = message.content.find((b) => b.type === 'text');
    const raw = textBlock?.text || '';

    let data;
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      data = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw };
    } catch {
      data = { raw };
    }

    res.json({ ticker, epic, label: EPICS[epic].label, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
