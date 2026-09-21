const express = require('express');
const router = express.Router();
const { query, queryOne } = require('../db/database');

// Função utilitária para registrar log (usada por outras rotas).
// Não é aguardada (await) pelas chamadoras — roda em segundo plano.
async function registrarLog(tipo, acao, usuario, usuario_email, descricao, ip) {
  try {
    await query(
      'INSERT INTO logs (tipo, acao, usuario, usuario_email, descricao, ip) VALUES ($1, $2, $3, $4, $5, $6)',
      [tipo, acao, usuario, usuario_email, descricao, ip || null]
    );
  } catch (e) {
    console.error('Erro ao registrar log:', e.message);
  }
}

// Listar logs (só admin)
router.get('/', async (req, res) => {
  try {
    const { tipo, usuario_email, limite = 100 } = req.query;
    let sql = 'SELECT * FROM logs';
    const params = [];
    const filtros = [];

    if (tipo) { params.push(tipo); filtros.push(`tipo = $${params.length}`); }
    if (usuario_email) { params.push(usuario_email); filtros.push(`usuario_email = $${params.length}`); }
    if (filtros.length) sql += ' WHERE ' + filtros.join(' AND ');
    params.push(parseInt(limite));
    sql += ` ORDER BY created_at DESC LIMIT $${params.length}`;

    const logs = await query(sql, params);
    res.json({ success: true, data: logs });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// Limpar logs (só admin)
router.delete('/', async (req, res) => {
  try {
    const { usuario_email } = req.body;
    const u = await queryOne('SELECT * FROM usuarios WHERE email = $1', [usuario_email]);
    if (!u?.is_admin) return res.status(403).json({ success: false, error: 'Sem permissão' });
    await query('DELETE FROM logs');
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

module.exports = router;
module.exports.registrarLog = registrarLog;
