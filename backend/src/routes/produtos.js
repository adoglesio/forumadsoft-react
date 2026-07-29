const express = require('express');
const router = express.Router();
const db = require('../db/database');

// Criar tabelas se não existirem
db.exec(`
  CREATE TABLE IF NOT EXISTS produtos (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    nome       TEXT UNIQUE NOT NULL,
    cor        TEXT DEFAULT '#0A5C8E',
    icone      TEXT DEFAULT '📦',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS usuario_produtos (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_email TEXT NOT NULL,
    produto_id    INTEGER NOT NULL,
    UNIQUE(usuario_email, produto_id),
    FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE
  );
`);

// Inserir produtos padrão se não existirem
const produtosDefault = [
  { nome: 'SIAFW',          cor: '#0A5C8E', icone: 'SIAFW' },
  { nome: 'SIAF Evolution', cor: '#1a7ab8', icone: 'siafEvolution' },
  { nome: 'GOL',            cor: '#0d1f3c', icone: 'GOL' },
  { nome: 'AdChef',         cor: '#4f46e5', icone: 'adchef' },
];
for (const p of produtosDefault) {
  db.prepare('INSERT OR IGNORE INTO produtos (nome, cor, icone) VALUES (?, ?, ?)').run(p.nome, p.cor, p.icone);
}

// ── Listar todos os produtos
router.get('/', (req, res) => {
  const produtos = db.prepare('SELECT * FROM produtos ORDER BY nome').all();
  res.json({ success: true, data: produtos });
});

// ── Criar produto (admin)
router.post('/', (req, res) => {
  const { nome, cor, icone, usuario_email } = req.body;
  const u = db.prepare('SELECT * FROM usuarios WHERE email = ?').get(usuario_email);
  if (!u?.isAdmin) return res.status(403).json({ success: false, error: 'Sem permissão' });
  if (!nome) return res.status(400).json({ success: false, error: 'Nome obrigatório' });
  try {
    const r = db.prepare('INSERT INTO produtos (nome, cor, icone) VALUES (?, ?, ?)').run(nome, cor || '#0A5C8E', icone || '📦');
    res.json({ success: true, data: db.prepare('SELECT * FROM produtos WHERE id = ?').get(r.lastInsertRowid) });
  } catch {
    res.status(400).json({ success: false, error: 'Produto já existe' });
  }
});

// ── Deletar produto (admin)
router.delete('/:id', (req, res) => {
  const { usuario_email } = req.body;
  const u = db.prepare('SELECT * FROM usuarios WHERE email = ?').get(usuario_email);
  if (!u?.isAdmin) return res.status(403).json({ success: false, error: 'Sem permissão' });
  db.prepare('DELETE FROM produtos WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ── Buscar produtos de um usuário
router.get('/usuario/:email', (req, res) => {
  const email = decodeURIComponent(req.params.email);
  const u = db.prepare('SELECT * FROM usuarios WHERE email = ?').get(email);
  if (!u) return res.status(404).json({ success: false, error: 'Usuário não encontrado' });
  if (u.isAdmin) {
    const todos = db.prepare('SELECT * FROM produtos ORDER BY nome').all();
    return res.json({ success: true, data: todos.map(p => p.id) });
  }
  const produtos = db.prepare(`
    SELECT p.id FROM produtos p
    INNER JOIN usuario_produtos up ON up.produto_id = p.id
    WHERE up.usuario_email = ?
  `).all(email).map(p => p.id);
  res.json({ success: true, data: produtos });
});

// ── Definir produtos de um usuário (admin)
router.put('/usuario/:email', (req, res) => {
  const { produto_ids, usuario_email } = req.body;
  const u = db.prepare('SELECT * FROM usuarios WHERE email = ?').get(usuario_email);
  if (!u?.isAdmin) return res.status(403).json({ success: false, error: 'Sem permissão' });
  const email = decodeURIComponent(req.params.email);
  db.prepare('DELETE FROM usuario_produtos WHERE usuario_email = ?').run(email);
  for (const id of (produto_ids || [])) {
    db.prepare('INSERT OR IGNORE INTO usuario_produtos (usuario_email, produto_id) VALUES (?, ?)').run(email, id);
  }
  res.json({ success: true });
});

module.exports = router;