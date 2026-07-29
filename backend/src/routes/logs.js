const express = require('express');
const router = express.Router();
const db = require('../db/database');

// Criar tabela de logs se não existir
db.exec(`
  CREATE TABLE IF NOT EXISTS logs (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo        TEXT NOT NULL,
    acao        TEXT NOT NULL,
    usuario     TEXT NOT NULL,
    usuario_email TEXT NOT NULL,
    descricao   TEXT NOT NULL,
    ip          TEXT,
    created_at  TEXT DEFAULT (datetime('now'))
  );
`);

// Função utilitária para registrar log (usada por outras rotas)
function registrarLog(tipo, acao, usuario, usuario_email, descricao, ip) {
  try {
    db.prepare(`
      INSERT INTO logs (tipo, acao, usuario, usuario_email, descricao, ip)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(tipo, acao, usuario, usuario_email, descricao, ip || null);
  } catch (e) {
    console.error('Erro ao registrar log:', e);
  }
}

// Listar logs (só admin)
router.get('/', (req, res) => {
  const { tipo, usuario_email, limite = 100 } = req.query;

  let query = 'SELECT * FROM logs';
  const params = [];
  const filtros = [];

  if (tipo) { filtros.push('tipo = ?'); params.push(tipo); }
  if (usuario_email) { filtros.push('usuario_email = ?'); params.push(usuario_email); }
  if (filtros.length) query += ' WHERE ' + filtros.join(' AND ');
  query += ' ORDER BY created_at DESC LIMIT ?';
  params.push(parseInt(limite));

  const logs = db.prepare(query).all(...params);
  res.json({ success: true, data: logs });
});

// Limpar logs antigos (só admin)
router.delete('/', (req, res) => {
  const { usuario_email } = req.body;
  const u = db.prepare('SELECT * FROM usuarios WHERE email = ?').get(usuario_email);
  if (!u?.isAdmin) return res.status(403).json({ success: false, error: 'Sem permissão' });
  db.prepare('DELETE FROM logs').run();
  res.json({ success: true });
});

module.exports = router;
module.exports.registrarLog = registrarLog;