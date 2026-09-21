require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const { query } = require('./db/database');

const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ── CORS ─────────────────────────────────────────────────────────────────
// Em produção, defina FRONTEND_URL no .env para restringir a origem.
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json({ limit: '10mb' }));

// ── Rotas da API ─────────────────────────────────────────────────────────
app.use('/api/usuarios', require('./routes/usuarios'));
app.use('/api/erros', require('./routes/erros'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/logs', require('./routes/logs'));
app.use('/api/reacoes', require('./routes/reacoes'));
app.use('/api/produtos', require('./routes/produtos'));

// ── Estatísticas ─────────────────────────────────────────────────────────
// "usuariosOnline" agora vem do Supabase Realtime Presence, direto no
// frontend — não faz mais sentido o backend rastrear isso.
app.get('/api/estatisticas', async (req, res) => {
  try {
    const [{ c: totalErros }] = await query('SELECT COUNT(*)::int as c FROM erros');
    const [{ c: totalComentarios }] = await query('SELECT COUNT(*)::int as c FROM comentarios');
    const [{ c: totalUsuarios }] = await query('SELECT COUNT(*)::int as c FROM usuarios');
    res.json({ success: true, data: { totalErros, totalComentarios, totalUsuarios } });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// ── Servir frontend buildado (só usado se você rodar frontend + backend
// juntos fora da Vercel; no deploy Vercel cada um é um projeto separado) ──
if (NODE_ENV === 'production' && process.env.VERCEL !== '1') {
  const distPath = path.join(__dirname, '..', '..', 'frontend', 'dist');
  app.use(express.static(distPath));
  app.get('/{*path}', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// ── Inicia servidor apenas quando rodado diretamente (node server.js) ────
// Na Vercel o arquivo backend/api/index.js importa `app` sem chamar listen().
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Backend rodando em http://0.0.0.0:${PORT}`);
    if (NODE_ENV !== 'production') {
      console.log(`   Frontend (Vite): npm run dev na pasta /frontend`);
      console.log(`   Acesso local:    http://localhost:5173`);
    }
  });
}

module.exports = app;
