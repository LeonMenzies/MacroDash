const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const router = express.Router();

// Escape literal control characters inside JSON string values
function sanitizeJsonStrings(s) {
  let inString = false, escaped = false, result = '';
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (escaped) { result += ch; escaped = false; continue; }
    if (ch === '\\') { result += ch; escaped = true; continue; }
    if (ch === '"') { inString = !inString; result += ch; continue; }
    if (inString && (ch === '\n' || ch === '\r')) { result += '\\n'; continue; }
    if (inString && ch === '\t') { result += '\\t'; continue; }
    result += ch;
  }
  return result;
}

function tryParseJson(s) {
  try { return JSON.parse(s); } catch {}
  // depth-track to find outermost object
  try {
    let depth = 0, start = -1;
    for (let i = 0; i < s.length; i++) {
      if (s[i] === '{') { if (depth === 0) start = i; depth++; }
      else if (s[i] === '}') { depth--; if (depth === 0 && start !== -1) return JSON.parse(s.slice(start, i + 1)); }
    }
  } catch {}
  // close truncated JSON by appending missing brackets
  try {
    let inStr = false, esc = false;
    const stack = [];
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (esc) { esc = false; continue; }
      if (c === '\\' && inStr) { esc = true; continue; }
      if (c === '"') { inStr = !inStr; continue; }
      if (inStr) continue;
      if (c === '{') stack.push('}');
      else if (c === '[') stack.push(']');
      else if (c === '}' || c === ']') stack.pop();
    }
    if (stack.length > 0) {
      // strip trailing incomplete string/value before closing
      const trimmed = s.replace(/,?\s*"[^"]*$/, '').replace(/,\s*$/, '');
      return JSON.parse(trimmed + stack.reverse().join(''));
    }
  } catch {}
  return null;
}

const EPICS = {
  latent: {
    label: 'Latent Catalysts',
    prompt: (ticker) => `You are a sell-side analyst. For ${ticker}, search for and return ONLY this JSON (no prose outside it):
{"events":[{"date":"","event":"","priceReaction":"","notes":"","source":""}],"estimateRevisions":[{"date":"","metric":"","change":"","source":""}],"summary":""}
Cover: price-moving events last 6 months with % reactions, EPS/revenue estimate revisions, short interest and positioning changes. For each item set "source" to the URL where you found the information.`,
  },
  definitive: {
    label: 'Definitive Calendar',
    prompt: (ticker) => `You are a sell-side analyst. For ${ticker}, search and return ONLY this JSON (no prose outside it):
{"nextEarnings":{"date":"","epsConsensus":"","revenueConsensus":"","impliedMove":"","source":""},"earningsHistory":[{"date":"","epsActual":"","epsConsensus":"","impliedMove":"","actualMove":"","source":""}],"upcomingEvents":[{"date":"","event":"","source":""}]}
Cover: next earnings (confirmed or est.), last 4 earnings beats/misses with implied vs actual moves, upcoming ex-div/investor days/buyback windows. For each item set "source" to the URL where you found the information.`,
  },
  horizon: {
    label: 'Horizon Pipeline',
    prompt: (ticker) => `You are a sell-side analyst. For ${ticker}, search and return ONLY this JSON (no prose outside it):
{"catalysts":[{"event":"","expectedTiming":"","confidence":"CONFIRMED|EXPECTED|RUMORED","bullCase":"","bullPoints":[""],"bearCase":"","bearPoints":[""],"estimatedMagnitude":"","source":""}]}
bullCase/bearCase are one-line summaries. bullPoints/bearPoints are 3-5 specific bullet points with detail (data, magnitude, conditions). Cover: product launches, regulatory decisions, M&A/spin-off speculation, activist involvement — 1-4 month horizon. For each item set "source" to the URL where you found the information.`,
  },
  macro: {
    label: 'Macro Overlay',
    prompt: (ticker) => `You are a sell-side analyst. For ${ticker}, search and return ONLY this JSON (no prose outside it):
{"sensitivities":[{"factor":"","direction":"positive|negative|mixed","beta":"","notes":"","source":""}],"regimeAssessment":"","riskOn":"","riskOnPoints":[""],"riskOff":"","riskOffPoints":[""]}
riskOn/riskOff are one-line summaries. riskOnPoints/riskOffPoints are 3-5 specific bullet points explaining what drives each scenario. Cover: rates/FX/commodity/credit betas, current macro regime impact, risk-on vs risk-off behaviour. For each sensitivity set "source" to the URL where you found the information.`,
  },
};

// Model configs — haiku is no-search, sonnet/opus get web search
const MODEL_CONFIGS = {
  haiku:  { id: 'claude-haiku-4-5-20251001',  maxTokens: 4096, webSearch: true },
  sonnet: { id: 'claude-sonnet-4-6',           maxTokens: 4096, webSearch: true },
  opus:   { id: 'claude-opus-4-7',             maxTokens: 4096, webSearch: true },
};

router.get('/:ticker', async (req, res) => {
  const ticker = req.params.ticker.toUpperCase();
  const epic = req.query.epic;
  const modelKey = MODEL_CONFIGS[req.query.model] ? req.query.model : 'haiku';
  const { id: modelId, maxTokens, webSearch } = MODEL_CONFIGS[modelKey];

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

  const client = webSearch
    ? new Anthropic({ defaultHeaders: { 'anthropic-beta': 'web-search-2025-03-05,prompt-caching-2024-07-31' } })
    : new Anthropic();

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
      let sources = [];

      const streamParams = webSearch
        ? {
            model: modelId,
            max_tokens: maxTokens,
            system: [{ type: 'text', text: 'You are a sell-side equity analyst. Return only valid JSON as specified. Be precise and data-driven.', cache_control: { type: 'ephemeral' } }],
            tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 3 }],
            messages: [{ role: 'user', content: EPICS[epic].prompt(ticker) }],
          }
        : {
            model: modelId,
            max_tokens: maxTokens,
            messages: [{ role: 'user', content: EPICS[epic].prompt(ticker) }],
          };

      const stream = client.messages.stream(streamParams);

      stream.on('streamEvent', (event) => {
        if (event.type === 'content_block_start') {
          const block = event.content_block;
          if (block.type === 'web_search_tool_result' && Array.isArray(block.content)) {
            for (const r of block.content) {
              if (r.type === 'web_search_result' && r.url) {
                sources.push({ title: r.title || r.url, url: r.url });
              }
            }
          }
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

      // Strip cite tags, markdown fences, trailing commas, then extract JSON
      let data;
      try {
        const cleaned = fullText
          .replace(/<cite[^>]*>([\s\S]*?)<\/cite>/g, '$1')
          .replace(/```(?:json)?\s*/g, '')
          .replace(/```/g, '')
          .replace(/,(\s*[}\]])/g, '$1');
        const start = cleaned.indexOf('{');
        const end = cleaned.lastIndexOf('}');
        if (start === -1 || end <= start) { data = { raw: fullText }; }
        else {
          const slice = cleaned.slice(start, end + 1);
          data = tryParseJson(slice) || tryParseJson(sanitizeJsonStrings(slice)) || { raw: fullText };
        }
      } catch {
        data = { raw: fullText };
      }

      if (sources.length > 0) data._sources = sources;
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
