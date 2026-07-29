const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { registrarLog } = require('./logs');

function getIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || null;
}

router.get('/', (req, res) => {
  const { filtro, produto_id, usuario_email } = req.query;
  let query = 'SELECT e.*, p.nome as produto_nome, p.cor as produto_cor, p.icone as produto_icone FROM erros e LEFT JOIN produtos p ON p.id = e.produto_id';
  const params = [];
  const where = [];

  // Filtrar por produtos do usuário (se não for admin)
  if (usuario_email) {
    const u = db.prepare('SELECT * FROM usuarios WHERE email = ?').get(usuario_email);
    if (u && !u.isAdmin) {
      const ids = db.prepare('SELECT produto_id FROM usuario_produtos WHERE usuario_email = ?').all(usuario_email).map(r => r.produto_id);
      if (ids.length > 0) {
        // Mostra erros do produto do usuário + erros sem produto vinculado
        where.push(`(e.produto_id IN (${ids.join(',')}) OR e.produto_id IS NULL)`);
      }
      // Se usuário sem produto vinculado: mostra só erros sem produto
      else {
        where.push('e.produto_id IS NULL');
      }
    }
  }

  if (produto_id) { where.push('e.produto_id = ?'); params.push(parseInt(produto_id)); }
  if (filtro) { where.push('(e.titulo LIKE ? OR e.descricao LIKE ?)'); params.push(`%${filtro}%`, `%${filtro}%`); }
  if (where.length) query += ' WHERE ' + where.join(' AND ');
  query += ' ORDER BY e.created_at DESC';

  let erros;
  erros = db.prepare(query).all(...params);
  const stmt = db.prepare('SELECT * FROM comentarios WHERE erro_id = ? ORDER BY data ASC');
  res.json({ success: true, data: erros.map(e => ({ ...e, comentarios: stmt.all(e.id) })) });
});

router.get('/:id', (req, res) => {
  const erro = db.prepare('SELECT e.*, p.nome as produto_nome, p.cor as produto_cor, p.icone as produto_icone FROM erros e LEFT JOIN produtos p ON p.id = e.produto_id WHERE e.id = ?').get(req.params.id);
  if (!erro) return res.status(404).json({ success: false, error: 'Erro não encontrado' });
  const comentarios = db.prepare('SELECT * FROM comentarios WHERE erro_id = ? ORDER BY data ASC').all(erro.id);
  res.json({ success: true, data: { ...erro, comentarios } });
});

router.post('/', (req, res) => {
  const { titulo, descricao, solucao, criador_email, criador_nome, imagem, produto_id } = req.body;
  if (!titulo || !descricao) return res.status(400).json({ success: false, error: 'Título e descrição são obrigatórios' });
  const r = db.prepare('INSERT INTO erros (titulo, descricao, solucao, criador_email, criador_nome, imagem, produto_id) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(titulo, descricao, solucao || '', criador_email || 'anonimo', criador_nome || 'Anônimo', imagem || null, produto_id || null);
  const novo = db.prepare('SELECT * FROM erros WHERE id = ?').get(r.lastInsertRowid);
  registrarLog('erro', 'erro_criado', criador_nome, criador_email, `${criador_nome} reportou o erro: "${titulo}"`, getIP(req));
  req.app.locals.broadcastSSE?.('novo_erro', { tipo: 'novo_erro', titulo: novo.titulo, criador_nome: novo.criador_nome, erroId: novo.id, mensagem: `${novo.criador_nome} reportou: "${novo.titulo}"`, timestamp: new Date().toISOString() });
  res.json({ success: true, data: { ...novo, comentarios: [] } });
});

router.put('/:id', (req, res) => {
  const { titulo, descricao, solucao, imagem, usuario_email, produto_id } = req.body;
  const erro = db.prepare('SELECT * FROM erros WHERE id = ?').get(req.params.id);
  if (!erro) return res.status(404).json({ success: false, error: 'Erro não encontrado' });
  const u = db.prepare('SELECT * FROM usuarios WHERE email = ?').get(usuario_email);
  if (!u?.isAdmin && erro.criador_email !== usuario_email) return res.status(403).json({ success: false, error: 'Sem permissão' });

  // produto_id: se vier no body (mesmo null), atualiza; se não vier, mantém o atual
  const novoProdutoId = produto_id !== undefined ? (produto_id ? parseInt(produto_id) : null) : erro.produto_id;

  db.prepare(`UPDATE erros SET titulo=COALESCE(?,titulo), descricao=COALESCE(?,descricao), solucao=COALESCE(?,solucao), imagem=?, produto_id=?, atualizado_em=datetime('now') WHERE id=?`)
    .run(titulo, descricao, solucao, imagem !== undefined ? imagem : erro.imagem, novoProdutoId, req.params.id);
  registrarLog('erro', 'erro_editado', u.nome, usuario_email, `${u.nome} editou o erro: "${erro.titulo}"`, getIP(req));
  res.json({ success: true, data: db.prepare('SELECT e.*, p.nome as produto_nome, p.cor as produto_cor, p.icone as produto_icone FROM erros e LEFT JOIN produtos p ON p.id = e.produto_id WHERE e.id = ?').get(req.params.id) });
});

router.delete('/:id', (req, res) => {
  const { usuario_email } = req.body;
  const erro = db.prepare('SELECT * FROM erros WHERE id = ?').get(req.params.id);
  if (!erro) return res.status(404).json({ success: false, error: 'Erro não encontrado' });
  const u = db.prepare('SELECT * FROM usuarios WHERE email = ?').get(usuario_email);
  if (!u?.isAdmin && erro.criador_email !== usuario_email) return res.status(403).json({ success: false, error: 'Sem permissão' });
  db.prepare('DELETE FROM erros WHERE id = ?').run(req.params.id);
  registrarLog('erro', 'erro_deletado', u.nome, usuario_email, `${u.nome} deletou o erro: "${erro.titulo}"`, getIP(req));
  res.json({ success: true });
});

router.post('/:id/comentarios', (req, res) => {
  const { conteudo, usuario, usuario_email } = req.body;
  if (!conteudo) return res.status(400).json({ success: false, error: 'Conteúdo obrigatório' });
  const erro = db.prepare('SELECT id, titulo FROM erros WHERE id = ?').get(req.params.id);
  if (!erro) return res.status(404).json({ success: false, error: 'Erro não encontrado' });
  const r = db.prepare('INSERT INTO comentarios (erro_id, usuario, usuario_email, conteudo) VALUES (?, ?, ?, ?)')
    .run(req.params.id, usuario || 'Anônimo', usuario_email || 'anonimo', conteudo);
  const novo = db.prepare('SELECT * FROM comentarios WHERE id = ?').get(r.lastInsertRowid);
  registrarLog('comentario', 'comentario_criado', usuario, usuario_email, `${usuario} comentou em "${erro.titulo}"`, getIP(req));
  req.app.locals.broadcastSSE?.('novo_comentario', { tipo: 'novo_comentario', usuario: novo.usuario, erroTitulo: erro.titulo, erroId: erro.id, mensagem: `${novo.usuario} comentou em "${erro.titulo}"`, timestamp: new Date().toISOString() });
  res.json({ success: true, data: novo });
});

router.put('/:erroId/comentarios/:comentarioId', (req, res) => {
  const { conteudo, usuario_email } = req.body;
  const c = db.prepare('SELECT * FROM comentarios WHERE id = ?').get(req.params.comentarioId);
  if (!c) return res.status(404).json({ success: false, error: 'Comentário não encontrado' });
  if (c.usuario_email !== usuario_email) return res.status(403).json({ success: false, error: 'Sem permissão' });
  db.prepare(`UPDATE comentarios SET conteudo=?, editado=1, editado_em=datetime('now') WHERE id=?`).run(conteudo, req.params.comentarioId);
  registrarLog('comentario', 'comentario_editado', c.usuario, usuario_email, `${c.usuario} editou um comentário`, getIP(req));
  res.json({ success: true, data: db.prepare('SELECT * FROM comentarios WHERE id = ?').get(req.params.comentarioId) });
});

router.delete('/:erroId/comentarios/:comentarioId', (req, res) => {
  const { usuario_email } = req.body;
  const c = db.prepare('SELECT * FROM comentarios WHERE id = ?').get(req.params.comentarioId);
  if (!c) return res.status(404).json({ success: false, error: 'Comentário não encontrado' });
  const u = db.prepare('SELECT * FROM usuarios WHERE email = ?').get(usuario_email);
  if (!u?.isAdmin && c.usuario_email !== usuario_email) return res.status(403).json({ success: false, error: 'Sem permissão' });
  db.prepare('DELETE FROM comentarios WHERE id = ?').run(req.params.comentarioId);
  registrarLog('comentario', 'comentario_deletado', u.nome, usuario_email, `${u.nome} deletou um comentário`, getIP(req));
  res.json({ success: true });
});

module.exports = router;