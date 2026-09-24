const express = require('express');
const router = express.Router();
const { query, queryOne } = require('../db/database');
const { registrarLog } = require('./logs');

// Lista todos os procedimentos (com filtro opcional por produto)
router.get('/', async (req, res) => {
  try {
    const { produto_id } = req.query;
    let sql = `select p.*, pr.nome as produto_nome, pr.cor as produto_cor, pr.icone as produto_icone
               from procedimentos p left join produtos pr on pr.id = p.produto_id`;
    const params = [];
    if (produto_id) { sql += ' where p.produto_id = $1'; params.push(produto_id); }
    sql += ' order by p.created_at desc';
    const rows = await query(sql, params);
    res.json({ success: true, data: rows });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// Cria o registro do procedimento (o PDF já foi enviado ao Storage antes disso)
router.post('/', async (req, res) => {
  try {
    const { titulo, descricao, arquivo_url, arquivo_nome, produto_id, criador_email, criador_nome } = req.body;
    if (!titulo || !arquivo_url || !arquivo_nome || !criador_email || !criador_nome) {
      return res.status(400).json({ success: false, error: 'Dados obrigatórios faltando' });
    }
    const row = await queryOne(
      `insert into procedimentos (titulo, descricao, arquivo_url, arquivo_nome, produto_id, criador_email, criador_nome)
       values ($1,$2,$3,$4,$5,$6,$7) returning *`,
      [titulo, descricao || '', arquivo_url, arquivo_nome, produto_id || null, criador_email, criador_nome]
    );
    registrarLog('procedimento', 'procedimento_criado', criador_nome, criador_email,
      `${criador_nome} cadastrou o procedimento "${titulo}"`, null);
    res.json({ success: true, data: row });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// Exclui (dono do procedimento ou admin)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { usuario_email } = req.body;
    const p = await queryOne('select * from procedimentos where id = $1', [id]);
    if (!p) return res.status(404).json({ success: false, error: 'Não encontrado' });
    const u = await queryOne('select is_admin from usuarios where email = $1', [usuario_email]);
    if (p.criador_email !== usuario_email && !u?.is_admin) {
      return res.status(403).json({ success: false, error: 'Sem permissão para excluir' });
    }
    await query('delete from procedimentos where id = $1', [id]);
    registrarLog('procedimento', 'procedimento_deletado', usuario_email, usuario_email,
      `Procedimento "${p.titulo}" excluído`, null);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

module.exports = router;
