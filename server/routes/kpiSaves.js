const express = require('express');
const supabase = require('../supabase');
const router = express.Router();

router.get('/:ticker', async (req, res) => {
  const { data, error } = await supabase
    .from('kpi_saves')
    .select('*')
    .eq('ticker', req.params.ticker.toUpperCase())
    .maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || null);
});

router.post('/', async (req, res) => {
  const { ticker, data } = req.body;
  if (!ticker || !data) return res.status(400).json({ error: 'ticker and data required' });
  const { data: row, error } = await supabase
    .from('kpi_saves')
    .upsert({ ticker: ticker.toUpperCase(), data, saved_at: new Date().toISOString() }, { onConflict: 'ticker' })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(row);
});

module.exports = router;
