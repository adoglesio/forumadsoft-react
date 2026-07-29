require('dotenv').config();
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const DB_PATH = path.join(__dirname, '..', '..', 'data', 'forum.db');
const DATA_DIR = path.join(__dirname, '..', '..', 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

// ── Tabelas principais
db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    email      TEXT UNIQUE NOT NULL,
    nome       TEXT NOT NULL,
    bio        TEXT DEFAULT '',
    senha      TEXT NOT NULL,
    avatar     TEXT,
    isAdmin    INTEGER DEFAULT 0,
    criado_em  TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS erros (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo        TEXT NOT NULL,
    descricao     TEXT NOT NULL,
    solucao       TEXT DEFAULT '',
    imagem        TEXT,
    criador_email TEXT NOT NULL,
    criador_nome  TEXT NOT NULL,
    produto_id    INTEGER,
    created_at    TEXT DEFAULT (datetime('now')),
    atualizado_em TEXT
  );

  CREATE TABLE IF NOT EXISTS comentarios (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    erro_id        INTEGER NOT NULL,
    usuario        TEXT NOT NULL,
    usuario_email  TEXT NOT NULL,
    conteudo       TEXT NOT NULL,
    editado        INTEGER DEFAULT 0,
    editado_em     TEXT,
    data           TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (erro_id) REFERENCES erros(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS produtos (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    nome       TEXT UNIQUE NOT NULL,
    cor        TEXT DEFAULT '#0A5C8E',
    icone      TEXT DEFAULT 'SIAFW',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS usuario_produtos (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_email TEXT NOT NULL,
    produto_id    INTEGER NOT NULL,
    UNIQUE(usuario_email, produto_id),
    FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS reacoes (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    erro_id       INTEGER NOT NULL,
    usuario_email TEXT NOT NULL,
    tipo          TEXT NOT NULL,
    created_at    TEXT DEFAULT (datetime('now')),
    UNIQUE(erro_id, usuario_email, tipo)
  );

  CREATE TABLE IF NOT EXISTS logs (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo          TEXT NOT NULL,
    acao          TEXT NOT NULL,
    usuario       TEXT NOT NULL,
    usuario_email TEXT NOT NULL,
    descricao     TEXT NOT NULL,
    ip            TEXT,
    created_at    TEXT DEFAULT (datetime('now'))
  );
`);

// ── Migrações seguras
const migrações = [
  `ALTER TABLE erros ADD COLUMN produto_id INTEGER REFERENCES produtos(id)`,
];
for (const m of migrações) {
  try { db.exec(m); } catch {}
}

// ── Admin padrão
function hashSenha(senha) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.createHash('sha256').update(salt + senha).digest('hex');
  return `${salt}:${hash}`;
}

const adminExiste = db.prepare('SELECT id FROM usuarios WHERE email = ?').get('adoglesio@adsoft.com.br');
if (!adminExiste) {
  db.prepare('INSERT INTO usuarios (email, nome, bio, senha, isAdmin) VALUES (?, ?, ?, ?, 1)')
    .run('adoglesio@adsoft.com.br', 'Adoglesio Gomes', 'Especialista em soluções técnicas | Adsoft', hashSenha('4071'));
  console.log('✅ Admin criado!');
}

console.log('✅ Banco de dados pronto:', DB_PATH);
module.exports = db;
