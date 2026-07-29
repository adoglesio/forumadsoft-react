const express = require('express');
const router = express.Router();

// Mensagens apenas em memória (some ao reiniciar)
const mensagens = [];
let msgId = 1;

// Listar mensagens
router.get('/', (req, res) => {
  res.json({ success: true, data: mensagens });
});

// Enviar mensagem
router.post('/', (req, res) => {
  const { usuario, usuario_email, avatar, conteudo } = req.body;
  if (!conteudo?.trim()) return res.status(400).json({ success: false, error: 'Mensagem vazia' });

  const nova = {
    id: msgId++,
    usuario,
    usuario_email,
    avatar: avatar || null,
    conteudo: conteudo.trim(),
    data: new Date().toISOString(),
  };

  mensagens.push(nova);

  // Limitar a 200 mensagens em memória
  if (mensagens.length > 200) mensagens.shift();

  // Broadcast SSE para todos
  req.app.locals.broadcastSSE?.('nova_mensagem_chat', nova);

  res.json({ success: true, data: nova });
});

// Deletar mensagem (só o próprio usuário)
router.delete('/:id', (req, res) => {
  const { usuario_email } = req.body;
  const idx = mensagens.findIndex(m => m.id === parseInt(req.params.id));

  if (idx === -1) return res.status(404).json({ success: false, error: 'Mensagem não encontrada' });
  if (mensagens[idx].usuario_email !== usuario_email)
    return res.status(403).json({ success: false, error: 'Sem permissão' });

  mensagens.splice(idx, 1);

  // Broadcast SSE para todos removerem da tela
  req.app.locals.broadcastSSE?.('mensagem_deletada_chat', { id: parseInt(req.params.id) });

  res.json({ success: true });
});

module.exports = router;