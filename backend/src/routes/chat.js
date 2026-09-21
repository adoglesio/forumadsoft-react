const express = require('express');
const router = express.Router();
const { query, queryOne } = require('../db/database');

// Mensagens agora persistem no Postgres (tabela `chat`). A entrega em tempo
// real para os outros usuários é feita pelo Supabase Realtime, direto do
// frontend — não precisamos mais fazer broadcast por SSE aqui.

router.get('/', async (req, res) => {
  try {
    const mensagens = await query('SELECT * FROM chat ORDER BY data ASC LIMIT 200');
    res.json({ success: true, data: mensagens });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { usuario, usuario_email, avatar, conteudo } = req.body;
    if (!conteudo?.trim()) return res.status(400).json({ success: false, error: 'Mensagem vazia' });
    const nova = await queryOne(
      'INSERT INTO chat (usuario, usuario_email, avatar, conteudo) VALUES ($1, $2, $3, $4) RETURNING *',
      [usuario, usuario_email, avatar || null, conteudo.trim()]
    );
    res.json({ success: true, data: nova });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const { usuario_email } = req.body;
    const msg = await queryOne('SELECT * FROM chat WHERE id = $1', [req.params.id]);
    if (!msg) return res.status(404).json({ success: false, error: 'Mensagem não encontrada' });
    if (msg.usuario_email !== usuario_email) return res.status(403).json({ success: false, error: 'Sem permissão' });
    await query('DELETE FROM chat WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

module.exports = router;
