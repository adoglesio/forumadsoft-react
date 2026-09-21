const express = require('express');
const router = express.Router();
const { query } = require('../db/database');

// Tabela já criada pelo supabase/schema.sql.

router.get('/:erroId', async (req, res) => {
  try {
    const reacoes = await query('SELECT tipo, COUNT(*)::int as total FROM reacoes WHERE erro_id = $1 GROUP BY tipo', [req.params.erroId]);
    const minhas = req.query.usuario_email
      ? (await query('SELECT tipo FROM reacoes WHERE erro_id = $1 AND usuario_email = $2', [req.params.erroId, req.query.usuario_email])).map(r => r.tipo)
      : [];
    res.json({ success: true, data: { reacoes, minhas } });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.post('/:erroId', async (req, res) => {
  try {
    const { usuario_email, tipo } = req.body;
    if (!usuario_email || !tipo) return res.status(400).json({ success: false });

    const existe = await query('SELECT id FROM reacoes WHERE erro_id = $1 AND usuario_email = $2 AND tipo = $3', [req.params.erroId, usuario_email, tipo]);

    if (existe.length) {
      await query('DELETE FROM reacoes WHERE id = $1', [existe[0].id]);
    } else {
      await query('INSERT INTO reacoes (erro_id, usuario_email, tipo) VALUES ($1, $2, $3)', [req.params.erroId, usuario_email, tipo]);
    }

    const reacoes = await query('SELECT tipo, COUNT(*)::int as total FROM reacoes WHERE erro_id = $1 GROUP BY tipo', [req.params.erroId]);
    const minhas = (await query('SELECT tipo FROM reacoes WHERE erro_id = $1 AND usuario_email = $2', [req.params.erroId, usuario_email])).map(r => r.tipo);
    res.json({ success: true, data: { reacoes, minhas } });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

module.exports = router;
