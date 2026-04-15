const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const router = express.Router();

const EPICS = {
  latent: {
    label: 'Latent Catalysts',
    prompt: (ticker) => `You are a sell-side analyst. For ${ticker}, search for and return ONLY this JSON (no prose outside it):
{"events":[{"date":"","event":"","priceReaction":"","notes":""}],"estimateRevisions":[{"date":"","metric":"","change":""}],"summary":""}
Cover: price-moving events last 6 months with % reactions, EPS/revenue estimate revisions, short interest and positioning changes.`,
  },
  definitive: {
    label: 'Definitive Calendar',
    prompt: (ticker) => `You are a sell-side analyst. For ${ticker}, search and return ONLY this JSON (no prose outside it):
{"nextEarnings":{"date":"","epsConsensus":"","revenueConsensus":"","impliedMove":""},"earningsHistory":[{"date":"","epsActual":"","epsConsensus":"","impliedMove":"","actualMove":""}],"upcomingEvents":[{"date":"","event":""}]}
Cover: next earnings (confirmed or est.), last 4 earnings beats/misses with implied vs actual moves, upcoming ex-div/investor days/buyback windows.`,
  },
  horizon: {
    label: 'Horizon Pipeline',
    prompt: (ticker) => `You are a sell-side analyst. For ${ticker}, search and return ONLY this JSON (no prose outside it):
{"catalysts":[{"event":"","expectedTiming":"","confidence":"CONFIRMED|EXPECTED|RUMORED","bullCase":"","bearCase":"","estimatedMagnitude":""}]}
Cover: product launches, regulatory decisions, M&A/spin-off speculation, activist involvement — 1-4 month horizon.`,
  },
  macro: {
    label: 'Macro Overlay',
    prompt: (ticker) => `You are a sell-side analyst. For ${ticker}, search and return ONLY this JSON (no prose outside it):
{"sensitivities":[{"factor":"","direction":"positive|negative|mixed","beta":"","notes":""}],"regimeAssessment":"","riskOn":"","riskOff":""}
Cover: rates/FX/commodity/credit betas, current macro regime impact, risk-on vs risk-off behaviour.`,
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

  // SSE setup
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  function send(obj) {
    res.write(`data: ${JSON.stringify(obj)}\n\n`);
  }

  const client = new Anthropic({ defaultHeaders: { 'anthropic-beta': 'web-search-2025-03-05' } });

  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) {
      const wait = attempt * 30;
      send({ type: 'status', message: `Rate limited — retrying in ${wait}s...` });
      await new Promise((r) => setTimeout(r, wait * 1000));
    }

    try {
      send({ type: 'status', message: 'Starting analysis...' });

      let fullText = '';
      let searchCount = 0;
      let inSearchBlock = false;
      let searchInputBuf = '';

      const stream = client.messages.stream({
        model: 'claude-sonnet-4-6',
        max_tokens: 1200,
        tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 3 }],
        messages: [{ role: 'user', content: EPICS[epic].prompt(ticker) }],
      });

      stream.on('streamEvent', (event) => {
        if (event.type === 'content_block_start') {
          const block = event.content_block;
          if (block.type === 'tool_use' && block.name === 'web_search') {
            searchCount++;
            inSearchBlock = true;
            searchInputBuf = '';
            send({ type: 'status', message: `Web search ${searchCount}/3...` });
          } else if (block.type === 'text') {
            inSearchBlock = false;
            send({ type: 'status', message: 'Writing analysis...' });
          }
        }

        if (event.type === 'content_block_delta' && inSearchBlock && event.delta?.type === 'input_json_delta') {
          searchInputBuf += event.delta.partial_json || '';
          try {
            const parsed = JSON.parse(searchInputBuf);
            if (parsed.query) send({ type: 'status', message: `Searching: "${parsed.query}"` });
          } catch {}
        }

        if (event.type === 'content_block_stop' && inSearchBlock) {
          inSearchBlock = false;
        }
      });

      stream.on('text', (delta) => {
        fullText += delta;
        send({ type: 'text', delta });
      });

      await stream.finalMessage();

      // Strip markdown fences if present, then extract outermost JSON object
      let data;
      try {
        const stripped = fullText.replace(/```(?:json)?\s*/g, '').replace(/```/g, '');
        const start = stripped.indexOf('{');
        const end = stripped.lastIndexOf('}');
        data = start !== -1 && end > start ? JSON.parse(stripped.slice(start, end + 1)) : { raw: fullText };
      } catch {
        data = { raw: fullText };
      }

      send({ type: 'done', ticker, epic, label: EPICS[epic].label, data });
      res.end();
      return;
    } catch (err) {
      if (err.status === 429 && attempt < 2) {
        console.warn(`Rate limited on attempt ${attempt + 1}`);
        continue;
      }
      console.error(err);
      send({ type: 'error', message: err.message });
      res.end();
      return;
    }
  }
});

module.exports = router;
