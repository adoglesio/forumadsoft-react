require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db/database');

const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

const usuariosOnline = new Map();
const TIMEOUT_MS = 60 * 1000;
const sseClients = new Map();
let sseId = 0;

// ── Limpa usuários inativos a cada 15s ──────────────────────────────────────
setInterval(() => {
  const agora = Date.now();
  for (const [email, info] of usuariosOnline.entries()) {
    if (agora - info.ultimo_ping > TIMEOUT_MS) usuariosOnline.delete(email);
  }
}, 15000);

// ── SSE broadcast ────────────────────────────────────────────────────────────
function broadcastSSE(event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const [id, res] of sseClients.entries()) {
    try { res.write(payload); } catch { sseClients.delete(id); }
  }
}
app.locals.broadcastSSE = broadcastSSE;

// ── CORS ─────────────────────────────────────────────────────────────────────
// Em dev: aceita qualquer origem (Vite em :5173 + acesso pela rede local)
// Em prod: ajuste para o domínio real se necessário
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));

// Bypass do aviso do ngrok
app.use((req, res, next) => {
  res.setHeader('ngrok-skip-browser-warning', 'true');
  next();
});

// ── Rotas da API ─────────────────────────────────────────────────────────────
app.use('/api/usuarios', require('./routes/usuarios'));
app.use('/api/erros', require('./routes/erros'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/logs', require('./routes/logs'));
app.use('/api/reacoes', require('./routes/reacoes'));
app.use('/api/produtos', require('./routes/produtos'));

app.get('/api/worldcup/squads', async (req, res) => {
  try {
    const headers = { Authorization: `Token ${process.env.SPORTS_API_KEY}` };
    const base = 'https://sports.bzzoiro.com/api/v2';

    // Ao vivo
    const liveRes = await fetch(`${base}/events/live/`, { headers });
    const liveData = await liveRes.json();
    const aoVivo = (liveData.events ?? []).filter(g => g.league_id === 27);

    // Jogos de hoje e amanhã — fase de grupos ainda tem times definidos
    const hoje = new Date();
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);

    const dateFrom = hoje.toISOString().split('T')[0];
    const dateTo = amanha.toISOString().split('T')[0];

    const outros = [];
    let offset = 0;

    while (outros.length < 10 && offset < 3000) {
      const r = await fetch(
        `${base}/events/?date_from=${dateFrom}&date_to=${dateTo}&limit=100&offset=${offset}`,
        { headers }
      );
      const d = await r.json();
      const results = d.results ?? [];
      if (results.length === 0) break;

      const copa = results.filter(g =>
        g.league_id === 27 &&
        g.status !== 'inprogress' &&
        g.home_team && g.away_team &&
        !g.home_team.match(/^[WL]\d|^\d|^[A-Z]\d|^[A-Z][A-Z]\d/) &&
        !g.away_team.match(/^[WL]\d|^\d|^[A-Z]\d|^[A-Z][A-Z]\d/)
      );
      outros.push(...copa);
      offset += 100;
    }

    console.log(`✅ Copa: ${aoVivo.length} ao vivo, ${outros.length} outros`);
    console.log('Times:', [...aoVivo, ...outros].map(g => `${g.home_team} vs ${g.away_team}`));

    res.json({ results: [...aoVivo, ...outros.slice(0, 10)] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
// ── SSE: notificações em tempo real ─────────────────────────────────────────
app.get('/api/notificacoes/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const clientId = ++sseId;
  sseClients.set(clientId, res);

  const hb = setInterval(() => {
    try { res.write(': heartbeat\n\n'); }
    catch { clearInterval(hb); sseClients.delete(clientId); }
  }, 25000);

  req.on('close', () => { clearInterval(hb); sseClients.delete(clientId); });
});

// ── Usuários online ───────────────────────────────────────────────────────────
app.post('/api/usuarios/ping', (req, res) => {
  const { email, nome, avatar } = req.body;
  if (!email) return res.status(400).json({ success: false });
  usuariosOnline.set(email, { nome, avatar, ultimo_ping: Date.now() });
  res.json({ success: true });
});

app.get('/api/usuarios/online', (req, res) => {
  const lista = Array.from(usuariosOnline.entries())
    .map(([email, info]) => ({ email, ...info }));
  res.json({ success: true, data: lista });
});

app.post('/api/usuarios/logout', (req, res) => {
  if (req.body.email) usuariosOnline.delete(req.body.email);
  res.json({ success: true });
});

// ── Estatísticas ─────────────────────────────────────────────────────────────
app.get('/api/estatisticas', (req, res) => {
  const totalErros = db.prepare('SELECT COUNT(*) as c FROM erros').get().c;
  const totalComentarios = db.prepare('SELECT COUNT(*) as c FROM comentarios').get().c;
  const totalUsuarios = db.prepare('SELECT COUNT(*) as c FROM usuarios').get().c;
  res.json({
    success: true,
    data: { totalErros, totalComentarios, totalUsuarios, usuariosOnline: usuariosOnline.size },
  });
});

// ── Servir frontend buildado (apenas em produção) ────────────────────────────
// Em desenvolvimento o Vite serve o frontend em :5173
// Em produção (NODE_ENV=production) o backend serve o dist
if (NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '..', '..', 'frontend', 'dist');
  app.use(express.static(distPath));
  app.get('/{*path}', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// ── Iniciar servidor ──────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Backend rodando em http://0.0.0.0:${PORT}`);
  if (NODE_ENV !== 'production') {
    console.log(`   Frontend (Vite): npm run dev na pasta /frontend`);
    console.log(`   Acesso local:    http://localhost:5173`);
    console.log(`   Acesso na rede:  http://192.168.0.80:5173`);
  }
});

