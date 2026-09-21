const { Pool } = require('pg');

// ─────────────────────────────────────────────────────────────────────────
// Conexão com o Postgres do Supabase.
// DATABASE_URL vem de: Supabase → Project Settings → Database → Connection
// string (modo "URI"). Ex: postgresql://postgres:SENHA@db.xxxx.supabase.co:5432/postgres
// ─────────────────────────────────────────────────────────────────────────
if (!process.env.DATABASE_URL) {
  console.warn('⚠️  DATABASE_URL não definida — configure o .env (veja .env.example)');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Retorna todas as linhas
async function query(sql, params = []) {
  const { rows } = await pool.query(sql, params);
  return rows;
}

// Retorna a primeira linha (ou undefined)
async function queryOne(sql, params = []) {
  const { rows } = await pool.query(sql, params);
  return rows[0];
}

module.exports = { query, queryOne, pool };
