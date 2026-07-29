import { useState, useEffect, useRef } from "react";
import {
  buscarErro, editarErro, excluirErro,
  adicionarComentario, editarComentario, excluirComentario,
} from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import Reacoes from "./Reacoes";
import PainelEmoji from "./PainelEmoji";
import LogoProduto from "./LogoProduto";
import { listarProdutos, getProdutosUsuario, editarErro as editarErroApi } from "../services/api";
import api from "../services/api";
import { IoPencil, IoTrash, IoSend, IoChatbubbles, IoCheckmarkCircle, IoDocument, IoArrowBack, IoCamera, IoClose } from "react-icons/io5";
import { MdOutlineDescription } from "react-icons/md";

// ─── Avatar com cache de perfis ───────────────────────────────────────────
const cacheAvatares = {};

function Avatar({ email, nome, size = 36 }) {
  const { tema } = useTheme();
  const [avatar, setAvatar] = useState(cacheAvatares[email] || null);

  useEffect(() => {
    if (!email || cacheAvatares[email] !== undefined) return;
    api.get(`/usuarios/perfil-publico/${encodeURIComponent(email)}`)
      .then(r => {
        const av = r.data.data?.avatar || null;
        cacheAvatares[email] = av;
        setAvatar(av);
      }).catch(() => { cacheAvatares[email] = null; });
  }, [email]);

  const cores = ["#0A5C8E","#7C3AED","#16A34A","#C26B2E","#DC2626","#0891B2"];
  const cor = cores[(nome?.charCodeAt(0) || 0) % cores.length];

  if (avatar?.startsWith("data:")) {
    return <img src={avatar} alt="" style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: `2px solid ${tema.headerBorder}` }} />;
  }
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: cor, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.38, fontWeight: 700, flexShrink: 0, border: `2px solid ${tema.headerBorder}` }}>
      {nome?.charAt(0)?.toUpperCase()}
    </div>
  );
}

export default function ErroDetailPage({ erroId, onVoltar, onAtualizar }) {
  const { user } = useAuth();
  const { tema } = useTheme();
  const [erro, setErro] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modoEdicao, setModoEdicao] = useState(false);

  useEffect(() => { carregar(); }, [erroId]);

  async function carregar() {
    setLoading(true);
    try { setErro(await buscarErro(erroId)); } finally { setLoading(false); }
  }

  async function handleExcluir() {
    if (!window.confirm("Excluir este erro permanentemente?")) return;
    await excluirErro(erroId, user.email);
    onAtualizar(); onVoltar();
  }

  if (loading) return <div style={{ textAlign: "center", padding: 60, color: tema.textoMutado }}>Carregando...</div>;
  if (!erro) return <div style={{ padding: 40 }}><p style={{ color: "#DC2626" }}>Erro não encontrado.</p></div>;

  const ehDono = user?.email === erro.criador_email;
  const ehAdmin = user?.isAdmin;

  if (modoEdicao) return (
    <EditarErroForm erro={erro} user={user}
      onCancelado={() => setModoEdicao(false)}
      onSalvo={() => { setModoEdicao(false); carregar(); onAtualizar(); }}
    />
  );

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "24px 16px" }}>
      <div style={cardStyle(tema)}>

        {/* Título + botões */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, gap: 12 }}>
          <div style={{ flex: 1 }}>
            {erro.produto_nome && (
              <div style={{ marginBottom: 8 }}>
                <LogoProduto icone={erro.produto_icone} nome={erro.produto_nome} cor={erro.produto_cor} size="sm" />
              </div>
            )}
            <h2 style={{ margin: 0, color: tema.textoPrimario, fontSize: 20, fontWeight: 700, lineHeight: 1.3 }}>{erro.titulo}</h2>
          </div>
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            {(ehDono || ehAdmin) && (
              <button onClick={() => setModoEdicao(true)} style={secondaryButton(tema)}><IoPencil style={{marginRight:4}} /> Editar</button>
            )}
            {ehAdmin && (
              <button onClick={handleExcluir} style={dangerButton}><IoTrash style={{marginRight:4}} /> Excluir</button>
            )}
          </div>
        </div>

        {/* Imagem */}
        {erro.imagem && (
          <img src={erro.imagem} alt="" style={{ width: "100%", maxHeight: 380, objectFit: "contain", borderRadius: 12, marginBottom: 20, border: `1px solid ${tema.headerBorder}` }} />
        )}

        {/* Reações */}
        <div style={{ marginBottom: 20 }}>
          <Reacoes erroId={erro.id} user={user} />
        </div>

        {/* Descrição */}
        <p style={tituloSecao(tema)}><MdOutlineDescription style={{marginRight:4,verticalAlign:"middle"}} /> Descrição</p>
        <div style={descricaoStyle(tema)}>{erro.descricao}</div>

        {/* Solução */}
        <p style={tituloSecao(tema)}><IoCheckmarkCircle style={{marginRight:4,verticalAlign:"middle",color:"#16A34A"}} /> Solução</p>
        <div style={solucaoStyle(tema)}>
          {erro.solucao || <em style={{ color: tema.textoMutado }}>Nenhuma solução registrada ainda.</em>}
        </div>

        {/* Criador */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 0", borderTop: `1px solid ${tema.headerBorder}` }}>
          <Avatar email={erro.criador_email} nome={erro.criador_nome} size={32} />
          <div>
            <span style={{ fontSize: 13, fontWeight: 600, color: tema.textoPrimario }}>{erro.criador_nome}</span>
            <span style={{ fontSize: 12, color: tema.textoMutado, marginLeft: 8 }}>
              {new Date(erro.created_at).toLocaleString("pt-BR")}
            </span>
          </div>
        </div>

        <hr style={{ margin: "16px 0 24px", borderColor: tema.headerBorder }} />

        <Comentarios erro={erro} user={user} onAtualizar={carregar} />
      </div>
    </div>
  );
}

function Comentarios({ erro, user, onAtualizar }) {
  const { tema } = useTheme();
  const [texto, setTexto] = useState("");
  const [editandoId, setEditandoId] = useState(null);
  const textareaRef = useRef();

  async function enviar() {
    if (!texto.trim()) return;
    await adicionarComentario(erro.id, { conteudo: texto, usuario: user.nome, usuario_email: user.email });
    setTexto(""); onAtualizar();
  }

  async function handleExcluir(cId) {
    if (!window.confirm("Excluir comentário?")) return;
    await excluirComentario(erro.id, cId, user.email);
    onAtualizar();
  }

  return (
    <>
      <h3 style={{ marginBottom: 16, color: tema.textoPrimario, fontSize: 16 }}>
        <IoChatbubbles style={{marginRight:6,verticalAlign:"middle"}} /> Comentários ({erro.comentarios?.length || 0})
      </h3>

      {(erro.comentarios || []).map((c) => (
        <div key={c.id} style={{ display: "flex", gap: 12, marginBottom: 16 }}>
          {/* Avatar */}
          <Avatar email={c.usuario_email} nome={c.usuario} size={36} />

          {/* Balão */}
          <div style={{ flex: 1 }}>
            <div style={{ background: tema.pageBg, borderRadius: "4px 12px 12px 12px", padding: "10px 14px", border: `1px solid ${tema.headerBorder}` }}>
              {/* Header do comentário */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <strong style={{ fontSize: 13, color: tema.textoPrimario }}>{c.usuario}</strong>
                  <small style={{ color: tema.textoMutado, fontSize: 11 }}>{new Date(c.data).toLocaleString("pt-BR")}</small>
                  {c.editado && <small style={{ color: tema.textoMutado, fontSize: 11 }}>(editado)</small>}
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  {c.usuario_email === user?.email && (
                    <button onClick={() => setEditandoId(editandoId === c.id ? null : c.id)} style={iconButton}>✏️</button>
                  )}
                  {(user?.isAdmin || c.usuario_email === user?.email) && (
                    <button onClick={() => handleExcluir(c.id)} style={iconButton}>🗑️</button>
                  )}
                </div>
              </div>

              {editandoId === c.id ? (
                <EditarComentario erroId={erro.id} comentario={c} userEmail={user.email}
                  onSalvo={() => { setEditandoId(null); onAtualizar(); }}
                  onCancelar={() => setEditandoId(null)}
                />
              ) : (
                <p style={{ margin: 0, whiteSpace: "pre-wrap", fontSize: 14, color: tema.textoPrimario, lineHeight: 1.6 }}>{c.conteudo}</p>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Input de novo comentário */}
      <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
        <Avatar email={user?.email} nome={user?.nome} size={36} />
        <div style={{ flex: 1 }}>
          <textarea
            ref={textareaRef}
            value={texto}
            onChange={e => setTexto(e.target.value)}
            onKeyDown={e => e.key === "Enter" && e.ctrlKey && enviar()}
            placeholder="Escreva um comentário... (Ctrl + Enter para enviar)"
            rows={3}
            style={{ width: "100%", padding: "10px 14px", borderRadius: "4px 12px 12px 12px", border: `1px solid ${tema.inputBorder}`, resize: "vertical", fontSize: 14, boxSizing: "border-box", background: tema.inputBg, color: tema.textoPrimario, outline: "none", lineHeight: 1.6 }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
            <button onClick={enviar} style={{ padding: "8px 20px", background: "#0A5C8E", color: "white", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
              <IoChatbubbles style={{marginRight:6}} /> Comentar
            </button>
            <PainelEmoji onSelecionar={(emoji) => {
              const el = textareaRef.current;
              if (el) {
                const s = el.selectionStart, e2 = el.selectionEnd;
                const novo = texto.substring(0, s) + emoji + texto.substring(e2);
                setTexto(novo);
                setTimeout(() => { el.focus(); el.setSelectionRange(s + emoji.length, s + emoji.length); }, 0);
              } else setTexto(t => t + emoji);
            }} />
            <span style={{ fontSize: 11, color: tema.textoMutado }}>Ctrl+Enter para enviar</span>
          </div>
        </div>
      </div>
    </>
  );
}

function EditarComentario({ erroId, comentario, userEmail, onSalvo, onCancelar }) {
  const { tema } = useTheme();
  const [texto, setTexto] = useState(comentario.conteudo);

  async function salvar() {
    if (!texto.trim()) return;
    await editarComentario(erroId, comentario.id, { conteudo: texto, usuario_email: userEmail });
    onSalvo();
  }

  return (
    <div>
      <textarea value={texto} onChange={e => setTexto(e.target.value)} rows={3}
        style={{ width: "100%", padding: 10, borderRadius: 8, border: `1px solid ${tema.inputBorder}`, resize: "vertical", fontSize: 14, boxSizing: "border-box", background: tema.inputBg, color: tema.textoPrimario, outline: "none" }} />
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button onClick={salvar} style={{ padding: "6px 16px", background: "#0A5C8E", color: "white", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}>Salvar</button>
        <button onClick={onCancelar} style={{ padding: "6px 12px", border: `1px solid ${tema.inputBorder}`, color: tema.textoSecundario, background: "transparent", borderRadius: 8, cursor: "pointer" }}>Cancelar</button>
      </div>
    </div>
  );
}

function EditarErroForm({ erro, user, onCancelado, onSalvo }) {
  const { tema } = useTheme();
  const [titulo, setTitulo] = useState(erro.titulo);
  const [descricao, setDescricao] = useState(erro.descricao);
  const [solucao, setSolucao] = useState(erro.solucao || "");
  const [imagem, setImagem] = useState(erro.imagem || null);
  const [msg, setMsg] = useState("");
  const [produtos, setProdutos] = useState([]);
  const [produtoId, setProdutoId] = useState(erro.produto_id || "");
  const fileRef = useRef();

  useEffect(() => {
    async function carregarProdutos() {
      try {
        const todos = await listarProdutos();
        const meus = await getProdutosUsuario(user.email);
        setProdutos(user.isAdmin ? todos : todos.filter(p => meus.includes(p.id)));
      } catch {}
    }
    carregarProdutos();
  }, [user]);

  async function salvar() {
    if (!titulo.trim() || !descricao.trim()) { setMsg("Preencha os campos obrigatórios."); return; }
    const ok = await editarErro(erro.id, { titulo, descricao, solucao, imagem, produto_id: produtoId || null, usuario_email: user.email });
    if (ok) { setMsg("✅ Salvo!"); setTimeout(onSalvo, 800); }
    else setMsg("❌ Não foi possível salvar.");
  }

  const inp = { width: "100%", padding: 12, marginBottom: 14, border: `1px solid ${tema.inputBorder}`, borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box", background: tema.inputBg, color: tema.textoPrimario };
  const lbl = { display: "block", fontWeight: 600, fontSize: 13, marginBottom: 6, color: tema.textoSecundario };

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "24px 16px" }}>
      <div style={cardStyle(tema)}>
        <h2 style={{ marginBottom: 20, color: tema.textoPrimario }}><IoPencil style={{marginRight:4}} /> Editar Erro</h2>

        {/* Produto */}
        {produtos.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <label style={lbl}>Produto</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                onClick={() => setProdutoId("")}
                style={{ padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, background: !produtoId ? tema.statBg1 : tema.inputBg, color: !produtoId ? tema.statCor1 : tema.textoSecundario, outline: !produtoId ? `2px solid ${tema.statCor1}` : `1px solid ${tema.inputBorder}` }}
              >
                Nenhum
              </button>
              {produtos.map(p => (
                <button
                  key={p.id}
                  onClick={() => setProdutoId(produtoId === p.id ? "" : p.id)}
                  style={{ padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, background: produtoId === p.id ? p.cor : tema.inputBg, color: produtoId === p.id ? "white" : tema.textoSecundario, outline: produtoId === p.id ? `2px solid ${p.cor}` : `1px solid ${tema.inputBorder}`, transition: "all 0.15s", display: "flex", alignItems: "center", gap: 6 }}
                >
                  <LogoProduto icone={p.icone} nome={p.nome} cor={p.cor} size="sm" style={{ height: 14, maxWidth: 60, filter: produtoId === p.id ? "brightness(10)" : "none" }} />
                </button>
              ))}
            </div>
          </div>
        )}

        <label style={lbl}>Título</label>
        <input value={titulo} onChange={e => setTitulo(e.target.value)} style={inp} />

        <label style={lbl}>Descrição</label>
        <textarea value={descricao} onChange={e => setDescricao(e.target.value)} rows={5} style={{ ...inp, resize: "vertical" }} />

        <label style={lbl}>Solução</label>
        <textarea value={solucao} onChange={e => setSolucao(e.target.value)} rows={4} style={{ ...inp, resize: "vertical" }} />

        {imagem && <img src={imagem} alt="" style={{ maxWidth: "100%", maxHeight: 200, borderRadius: 8, marginBottom: 8 }} />}

        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <button onClick={() => fileRef.current.click()} style={{ padding: "8px 16px", border: `1px solid ${tema.inputBorder}`, color: tema.textoSecundario, background: tema.cardBg, borderRadius: 8, cursor: "pointer" }}><IoCamera style={{marginRight:4}} /> Imagem</button>
          {imagem && <button onClick={() => setImagem(null)} style={{ background: "none", border: "none", color: "#DC2626", cursor: "pointer" }}><IoClose style={{marginRight:4}} /> Remover</button>}
          <input type="file" ref={fileRef} accept="image/*" style={{ display: "none" }} onChange={e => { if (e.target.files[0]) { const r = new FileReader(); r.onload = ev => setImagem(ev.target.result); r.readAsDataURL(e.target.files[0]); } }} />
        </div>

        {msg && <p style={{ color: msg.includes("✅") ? "#16A34A" : "#DC2626" }}>{msg}</p>}

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancelado} style={{ padding: "10px 20px", background: "transparent", border: `1px solid ${tema.inputBorder}`, borderRadius: 8, cursor: "pointer", color: tema.textoSecundario }}>Cancelar</button>
          <button onClick={salvar} style={{ padding: "10px 24px", background: "#0A5C8E", color: "white", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}><IoSend style={{marginRight:4}} /> Salvar</button>
        </div>
      </div>
    </div>
  );
}

const cardStyle = (tema) => ({ background: tema.cardBg, borderRadius: 20, padding: 28, boxShadow: "0 2px 16px rgba(0,0,0,0.05)", border: `1px solid ${tema.asideBorder}`, marginTop: 16 });
const secondaryButton = (tema) => ({ padding: "8px 14px", border: "1px solid #0A5C8E", color: "#0A5C8E", background: tema.cardBg, borderRadius: 8, cursor: "pointer" });
const dangerButton = { padding: "8px 14px", border: "none", background: "#DC2626", color: "white", borderRadius: 8, cursor: "pointer" };
const iconButton = { background: "none", border: "none", cursor: "pointer", fontSize: 14, padding: "2px 4px" };
const tituloSecao = (tema) => ({ fontWeight: 700, color: tema.textoPrimario, marginBottom: 8, fontSize: 14 });
const descricaoStyle = (tema) => ({ background: tema.pageBg, border: `1px solid ${tema.headerBorder}`, borderRadius: 12, padding: 16, whiteSpace: "pre-wrap", fontSize: 14, lineHeight: 1.7, marginBottom: 20, color: tema.textoPrimario });
const solucaoStyle = (tema) => ({ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 12, padding: 16, whiteSpace: "pre-wrap", fontSize: 14, lineHeight: 1.7, marginBottom: 20, color: "#1a472a" });