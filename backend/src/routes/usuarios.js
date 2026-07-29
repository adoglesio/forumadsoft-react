const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../db/database');
const { registrarLog } = require('./logs');

function hashSenha(senha) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.createHash('sha256').update(salt + senha).digest('hex');
  return `${salt}:${hash}`;
}

function verificarSenha(plain, hash) {
  if (!hash.includes(':')) return plain === hash;
  const [salt, h] = hash.split(':');
  const calc = crypto.createHash('sha256').update(salt + plain).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(h), Buffer.from(calc));
}

function getIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || null;
}


router.get('/listar', (req, res) => {
  const usuarios = db.prepare('SELECT id, email, nome, isAdmin, criado_em FROM usuarios ORDER BY nome').all();
  res.json({ success: true, data: usuarios.map(u => ({ ...u, isAdmin: u.isAdmin === 1 })) });
});

router.post('/login', (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) return res.status(400).json({ success: false, error: 'Email e senha obrigatórios' });
  const u = db.prepare('SELECT * FROM usuarios WHERE email = ?').get(email);
  if (!u) {
    registrarLog('auth', 'login_falhou', email, email, `Tentativa de login com email não encontrado`, getIP(req));
    return res.status(401).json({ success: false, error: 'Usuário não encontrado.' });
  }
  if (!verificarSenha(senha, u.senha)) {
    registrarLog('auth', 'login_falhou', u.nome, email, `Senha incorreta`, getIP(req));
    return res.status(401).json({ success: false, error: 'Senha incorreta.' });
  }
  registrarLog('auth', 'login', u.nome, email, `${u.nome} fez login`, getIP(req));
  const { senha: _, ...dados } = u;
  res.json({ success: true, data: { ...dados, isAdmin: dados.isAdmin === 1 } });
});

router.get('/perfil-publico/:email', (req, res) => {
  const email = decodeURIComponent(req.params.email);
  const u = db.prepare('SELECT * FROM usuarios WHERE email = ?').get(email);
  if (!u) return res.status(404).json({ success: false, error: 'Usuário não encontrado' });
  const errosReportados = db.prepare('SELECT COUNT(*) as c FROM erros WHERE criador_email = ?').get(email).c;
  const totalComentarios = db.prepare('SELECT COUNT(*) as c FROM comentarios WHERE usuario_email = ?').get(email).c;
  res.json({ success: true, data: { nome: u.nome, email: u.email, bio: u.bio || '', avatar: u.avatar, isAdmin: u.isAdmin === 1, criado_em: u.criado_em, errosReportados, totalComentarios } });
});

router.put('/perfil', (req, res) => {
  const { email, avatar, bio, nome } = req.body;
  if (!email) return res.status(400).json({ success: false, error: 'Email obrigatório' });
  db.prepare('UPDATE usuarios SET avatar = COALESCE(?, avatar), bio = COALESCE(?, bio), nome = COALESCE(?, nome) WHERE email = ?')
    .run(avatar, bio, nome, email);
  const { senha: _, ...u } = db.prepare('SELECT * FROM usuarios WHERE email = ?').get(email);
  registrarLog('perfil', 'perfil_atualizado', u.nome, email, `${u.nome} atualizou o perfil`, null);
  res.json({ success: true, data: u });
});

router.put('/senha', (req, res) => {
  const { email, senhaAtual, novaSenha } = req.body;
  if (!email || !senhaAtual || !novaSenha) return res.status(400).json({ success: false, error: 'Dados incompletos' });
  const u = db.prepare('SELECT * FROM usuarios WHERE email = ?').get(email);
  if (!u) return res.status(404).json({ success: false, error: 'Usuário não encontrado' });
  if (!verificarSenha(senhaAtual, u.senha)) return res.status(401).json({ success: false, error: 'Senha atual incorreta' });
  if (novaSenha.length < 4) return res.status(400).json({ success: false, error: 'Mínimo 4 caracteres' });
  db.prepare('UPDATE usuarios SET senha = ? WHERE email = ?').run(hashSenha(novaSenha), email);
  registrarLog('perfil', 'senha_alterada', u.nome, email, `${u.nome} alterou a senha`, null);
  res.json({ success: true });
});

module.exports = router;