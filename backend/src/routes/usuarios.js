const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { query, queryOne } = require('../db/database');
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
  try {
    return crypto.timingSafeEqual(Buffer.from(h, 'hex'), Buffer.from(calc, 'hex'));
  } catch {
    return false;
  }
}

function getIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || null;
}

router.get('/listar', async (req, res) => {
  try {
    const usuarios = await query('SELECT id, email, nome, is_admin AS "isAdmin", criado_em FROM usuarios ORDER BY nome');
    res.json({ success: true, data: usuarios });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    if (!email || !senha) return res.status(400).json({ success: false, error: 'Email e senha obrigatórios' });
    const u = await queryOne('SELECT * FROM usuarios WHERE email = $1', [email]);
    if (!u) {
      registrarLog('auth', 'login_falhou', email, email, 'Tentativa de login com email não encontrado', getIP(req));
      return res.status(401).json({ success: false, error: 'Usuário não encontrado.' });
    }
    if (!verificarSenha(senha, u.senha)) {
      registrarLog('auth', 'login_falhou', u.nome, email, 'Senha incorreta', getIP(req));
      return res.status(401).json({ success: false, error: 'Senha incorreta.' });
    }
    registrarLog('auth', 'login', u.nome, email, `${u.nome} fez login`, getIP(req));
    const { senha: _, is_admin, ...dados } = u;
    res.json({ success: true, data: { ...dados, isAdmin: is_admin } });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.get('/perfil-publico/:email', async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email);
    const u = await queryOne('SELECT * FROM usuarios WHERE email = $1', [email]);
    if (!u) return res.status(404).json({ success: false, error: 'Usuário não encontrado' });
    const { c: errosReportados } = await queryOne('SELECT COUNT(*)::int as c FROM erros WHERE criador_email = $1', [email]);
    const { c: totalComentarios } = await queryOne('SELECT COUNT(*)::int as c FROM comentarios WHERE usuario_email = $1', [email]);
    res.json({ success: true, data: { nome: u.nome, email: u.email, bio: u.bio || '', avatar: u.avatar, isAdmin: u.is_admin, criado_em: u.criado_em, errosReportados, totalComentarios } });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.put('/perfil', async (req, res) => {
  try {
    const { email, avatar, bio, nome } = req.body;
    if (!email) return res.status(400).json({ success: false, error: 'Email obrigatório' });
    await query(
      'UPDATE usuarios SET avatar = COALESCE($1, avatar), bio = COALESCE($2, bio), nome = COALESCE($3, nome) WHERE email = $4',
      [avatar, bio, nome, email]
    );
    const u = await queryOne('SELECT id, email, nome, bio, avatar, is_admin AS "isAdmin", criado_em FROM usuarios WHERE email = $1', [email]);
    registrarLog('perfil', 'perfil_atualizado', u.nome, email, `${u.nome} atualizou o perfil`, null);
    res.json({ success: true, data: u });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.put('/senha', async (req, res) => {
  try {
    const { email, senhaAtual, novaSenha } = req.body;
    if (!email || !senhaAtual || !novaSenha) return res.status(400).json({ success: false, error: 'Dados incompletos' });
    const u = await queryOne('SELECT * FROM usuarios WHERE email = $1', [email]);
    if (!u) return res.status(404).json({ success: false, error: 'Usuário não encontrado' });
    if (!verificarSenha(senhaAtual, u.senha)) return res.status(401).json({ success: false, error: 'Senha atual incorreta' });
    if (novaSenha.length < 4) return res.status(400).json({ success: false, error: 'Mínimo 4 caracteres' });
    await query('UPDATE usuarios SET senha = $1 WHERE email = $2', [hashSenha(novaSenha), email]);
    registrarLog('perfil', 'senha_alterada', u.nome, email, `${u.nome} alterou a senha`, null);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

module.exports = router;
