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