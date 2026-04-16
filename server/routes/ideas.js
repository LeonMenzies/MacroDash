const express = require('express');
const { randomUUID } = require('crypto');
const supabase = require('../supabase');

const router = express.Router();

router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('ideas')
    .select('*')
    .order('date', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/', async (req, res) => {
  const { text, tag } = req.body;
  if (!text) return res.status(400).json({ error: 'text is required' });
  const { data, error } = await supabase
    .from('ideas')
    .insert({ id: randomUUID(), date: new Date().toISOString(), tag: tag || 'idea', text })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.patch('/:id/status', async (req, res) => {
  const { status } = req.body;
  if (!['open', 'watching', 'done'].includes(status)) return res.status(400).json({ error: 'invalid status' });
  const { data, error } = await supabase
    .from('ideas')
    .update({ status })
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.delete('/:id', async (req, res) => {
  const { error, count } = await supabase
    .from('ideas')
    .delete({ count: 'exact' })
    .eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  if (count === 0) return res.status(404).json({ error: 'not found' });
  res.json({ ok: true });
});

module.exports = router;
