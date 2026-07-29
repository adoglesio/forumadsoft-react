const express = require('express');
const router = express.Router();
const db = require('../db/database');

// Criar tabela se não existir
db.exec(`
  CREATE TABLE IF NOT EXISTS reacoes (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    erro_id       INTEGER NOT NULL,
    usuario_email TEXT NOT NULL,
    tipo          TEXT NOT NULL,
    created_at    TEXT DEFAULT (datetime('now')),
    UNIQUE(erro_id, usuario_email, tipo)
  );
`);

// Buscar reações de um erro
router.get('/:erroId', (req, res) => {
  const reacoes = db.prepare('SELECT tipo, COUNT(*) as total FROM reacoes WHERE erro_id = ? GROUP BY tipo').all(req.params.erroId);
  const minhas = req.query.usuario_email
    ? db.prepare('SELECT tipo FROM reacoes WHERE erro_id = ? AND usuario_email = ?').all(req.params.erroId, req.query.usuario_email).map(r => r.tipo)
    : [];
  res.json({ success: true, data: { reacoes, minhas } });
});

// Adicionar ou remover reação (toggle)
router.post('/:erroId', (req, res) => {
  const { usuario_email, tipo } = req.body;
  if (!usuario_email || !tipo) return res.status(400).json({ success: false });

  const existe = db.prepare('SELECT id FROM reacoes WHERE erro_id = ? AND usuario_email = ? AND tipo = ?').get(req.params.erroId, usuario_email, tipo);

  if (existe) {
    db.prepare('DELETE FROM reacoes WHERE id = ?').run(existe.id);
  } else {
    db.prepare('INSERT INTO reacoes (erro_id, usuario_email, tipo) VALUES (?, ?, ?)').run(req.params.erroId, usuario_email, tipo);
  }

  const reacoes = db.prepare('SELECT tipo, COUNT(*) as total FROM reacoes WHERE erro_id = ? GROUP BY tipo').all(req.params.erroId);
  const minhas = db.prepare('SELECT tipo FROM reacoes WHERE erro_id = ? AND usuario_email = ?').all(req.params.erroId, usuario_email).map(r => r.tipo);
  res.json({ success: true, data: { reacoes, minhas } });
});

module.exports = router;