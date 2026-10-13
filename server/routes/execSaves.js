const express = require('express');
const supabase = require('../supabase');
const router = express.Router();

router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('exec_saves')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/', async (req, res) => {
  const { filename, summary } = req.body;
  if (!filename || !summary) return res.status(400).json({ error: 'filename and summary required' });
  const { data, error } = await supabase
    .from('exec_saves')
    .insert({ filename, summary })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.delete('/:id', async (req, res) => {
  const { error } = await supabase.from('exec_saves').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

module.exports = router;
