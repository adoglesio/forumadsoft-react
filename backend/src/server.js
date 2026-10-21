require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app      = express();
const PORT     = process.env.PORT    || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

//  CORS 
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json({ limit: '10mb' }));

//  HealthCheck (usado pela Vercel para verificar que a função sobe
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, env: NODE_ENV, ts: new Date().toISOString() });
});

//  Rotas da API 
// Carregamos as rotas de forma lazy para que um erro num único arquivo
// não impeça o restantessss de subir.
function safeRoute(path) {
  try {
    return require(path);
  } catch (err) {
    console.error(`Erro ao carregar rota ${path}:`, err.message);
    const r = express.Router();
    r.all('*', (_req, res) => res.status(500).json({ error: `Rota ${path} falhou ao carregar: ${err.message}` }));
    return r;
  }
}

app.use('/api/usuarios',     safeRoute('./routes/usuarios'));
app.use('/api/erros',        safeRoute('./routes/erros'));
app.use('/api/procedimentos',safeRoute('./routes/procedimentos'));
app.use('/api/logs',         safeRoute('./routes/logs'));
app.use('/api/reacoes',      safeRoute('./routes/reacoes'));
app.use('/api/produtos',     safeRoute('./routes/produtos'));
// /api/chat removido — chat migrado para Supabase Realtime

//  Estatisticas 
app.get('/api/estatisticas', async (req, res) => {
  try {
    const { query } = require('./db/database');
    const [{ c: totalErros }]       = await query('SELECT COUNT(*)::int as c FROM erros');
    const [{ c: totalComentarios }] = await query('SELECT COUNT(*)::int as c FROM comentarios');
    const [{ c: totalUsuarios }]    = await query('SELECT COUNT(*)::int as c FROM usuarios');
    res.json({ success: true, data: { totalErros, totalComentarios, totalUsuarios } });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

//  404 generico 
app.use((_req, res) => res.status(404).json({ error: 'Rota não encontrada' }));

//  Inicia servidor apenas quando rodado diretomente
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Backend rodando em http://0.0.0.0:${PORT}`);
  });
}

module.exports = app;