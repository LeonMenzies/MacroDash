const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const supabase = require('../supabase');
const router = express.Router();

const MODEL_CONFIGS = {
  haiku:  { id: 'claude-haiku-4-5-20251001',  maxTokens: 8192 },
  sonnet: { id: 'claude-sonnet-4-6',           maxTokens: 8192 },
  opus:   { id: 'claude-opus-4-7',             maxTokens: 8192 },
};

function buildPrompt(industry) {
  return `You are a senior equity research analyst. For the "${industry}" industry, search for current data and return ONLY this JSON (no prose outside it):
{
  "industry": "",
  "executive_summary": "",
  "overview": "",
  "sector_drivers": [{"driver": "", "impact": "positive|negative|mixed", "notes": "", "source": ""}],
  "bottlenecks": [{"name": "", "severity": "HIGH|MEDIUM|LOW", "description": "", "source": ""}],
  "key_players": [{"company": "", "role": "", "market_position": "", "source": ""}],
  "value_chain": {
    "upstream": "",
    "midstream": "",
    "downstream": ""
  },
  "economics": {
    "margins": "",
    "capex_intensity": "",
    "cyclicality": "",
    "notes": ""
  },
  "investment_considerations": ""
}

Requirements (be concise — keep each text field under 60 words):
- executive_summary: 2 sentences, investment-oriented
- overview: 1 short paragraph
- sector_drivers: exactly 4 drivers, notes under 30 words each
- bottlenecks: exactly 3 bottlenecks, description under 30 words each
- key_players: exactly 5 companies, market_position under 20 words
- value_chain: 1 sentence per layer
- economics: single values for margins/capex_intensity/cyclicality, notes under 30 words
- investment_considerations: 2 sentences max
For each item with a source field, set it to the URL where you found the information.`;
}

router.get('/:industry', async (req, res) => {
  const industry = req.params.industry;
  const modelKey = MODEL_CONFIGS[req.query.model] ? req.query.model : 'haiku';
  const { id: modelId, maxTokens } = MODEL_CONFIGS[modelKey];

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: 'ANTHROPIC_API_KEY not configured' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  function send(obj) {
    res.write(`data: ${JSON.stringify(obj)}\n\n`);
  }

  const client = new Anthropic({
    defaultHeaders: { 'anthropic-beta': 'web-search-2025-03-05,prompt-caching-2024-07-31' },
  });

  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) {
      const wait = attempt * 30;
      send({ type: 'status', message: `Rate limited — retrying in ${wait}s...` });
      await new Promise((r) => setTimeout(r, wait * 1000));
    }

    try {
      send({ type: 'status', message: 'Starting industry analysis...' });

      let fullText = '';
      let searchCount = 0;
      let inSearchBlock = false;
      let searchInputBuf = '';

      const stream = client.messages.stream({
        model: modelId,
        max_tokens: maxTokens,
        system: [{ type: 'text', text: 'You are a senior equity research analyst. Return only valid JSON as specified. Be precise and data-driven.', cache_control: { type: 'ephemeral' } }],
        tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 3 }],
        messages: [{ role: 'user', content: buildPrompt(industry) }],
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

      stream.on('text', (delta) => { fullText += delta; });

      await stream.finalMessage();

      let data;
      try {
        const cleaned = fullText
          .replace(/<cite[^>]*>([\s\S]*?)<\/cite>/g, '$1')
          .replace(/```(?:json)?\s*/g, '')
          .replace(/```/g, '');
        const start = cleaned.indexOf('{');
        const end = cleaned.lastIndexOf('}');
        data = start !== -1 && end > start ? JSON.parse(cleaned.slice(start, end + 1)) : { raw: fullText };
      } catch {
        data = { raw: fullText };
      }

      send({ type: 'done', industry, data });
      res.end();
      supabase.from('industry_saves').insert({ industry, data, saved_at: new Date().toISOString() }).then(() => {});
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
