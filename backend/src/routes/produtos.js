const express = require('express');
const router = express.Router();
const { query, queryOne } = require('../db/database');

// Tabelas e produtos padrão já são criados pelo supabase/schema.sql —
// não é preciso criar nada aqui em tempo de execução.

router.get('/', async (req, res) => {
  try {
    res.json({ success: true, data: await query('SELECT * FROM produtos ORDER BY nome') });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { nome, cor, icone, usuario_email } = req.body;
    const u = await queryOne('SELECT * FROM usuarios WHERE email = $1', [usuario_email]);
    if (!u?.is_admin) return res.status(403).json({ success: false, error: 'Sem permissão' });
    if (!nome) return res.status(400).json({ success: false, error: 'Nome obrigatório' });
    const novo = await queryOne(
      'INSERT INTO produtos (nome, cor, icone) VALUES ($1, $2, $3) RETURNING *',
      [nome, cor || '#0A5C8E', icone || '📦']
    );
    res.json({ success: true, data: novo });
  } catch (e) {
    res.status(400).json({ success: false, error: e.code === '23505' ? 'Produto já existe' : e.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { usuario_email } = req.body;
    const u = await queryOne('SELECT * FROM usuarios WHERE email = $1', [usuario_email]);
    if (!u?.is_admin) return res.status(403).json({ success: false, error: 'Sem permissão' });
    await query('DELETE FROM produtos WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.get('/usuario/:email', async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email);
    const u = await queryOne('SELECT * FROM usuarios WHERE email = $1', [email]);
    if (!u) return res.status(404).json({ success: false, error: 'Usuário não encontrado' });
    if (u.is_admin) {
      const todos = await query('SELECT id FROM produtos ORDER BY nome');
      return res.json({ success: true, data: todos.map(p => p.id) });
    }
    const produtos = await query(
      `SELECT p.id FROM produtos p
       INNER JOIN usuario_produtos up ON up.produto_id = p.id
       WHERE up.usuario_email = $1`,
      [email]
    );
    res.json({ success: true, data: produtos.map(p => p.id) });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.put('/usuario/:email', async (req, res) => {
  try {
    const { produto_ids, usuario_email } = req.body;
    const u = await queryOne('SELECT * FROM usuarios WHERE email = $1', [usuario_email]);
    if (!u?.is_admin) return res.status(403).json({ success: false, error: 'Sem permissão' });
    const email = decodeURIComponent(req.params.email);
    await query('DELETE FROM usuario_produtos WHERE usuario_email = $1', [email]);
    for (const id of (produto_ids || [])) {
      await query('INSERT INTO usuario_produtos (usuario_email, produto_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [email, id]);
    }
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

module.exports = router;
