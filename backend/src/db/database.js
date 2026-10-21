const { Pool } = require('pg');

// DATABASE_URL vem das env vars da Vercel (Settings → Environment Variables)
// Formato: postgresql://postgres:SENHA@db.xxxx.supabase.co:5432/postgres
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.warn('⚠️  DATABASE_URL não definida — configure nas env vars da Vercel');
}

let pool = null;

function getPool() {
  if (!pool) {
    if (!DATABASE_URL) throw new Error('DATABASE_URL não configurada nas variáveis de ambiente da Vercel');
    pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 5, // serverless — não abre muitas conexões
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 5000,
    });
  }
  return pool;
}

async function query(sql, params = []) {
  const { rows } = await getPool().query(sql, params);
  return rows;
}

async function queryOne(sql, params = []) {
  const { rows } = await getPool().query(sql, params);
  return rows[0];
}

module.exports = { query, queryOne, getPool };