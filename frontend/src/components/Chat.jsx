import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import api from "../services/api";
import { IoChatbubbleEllipses, IoSend, IoTrash, IoClose } from "react-icons/io5";

export default function Chat() {
  const { user } = useAuth();
  const { tema } = useTheme();
  const [aberto, setAberto] = useState(false);
  const [mensagens, setMensagens] = useState([]);
  const [texto, setTexto] = useState("");
  const [naoLidas, setNaoLidas] = useState(0);
  const bottomRef = useRef();
  const inputRef = useRef();

  useEffect(() => {
    if (!aberto) return;
    api.get("/chat").then(r => setMensagens(r.data.data)).catch(() => {});
    setNaoLidas(0);
  }, [aberto]);

  useEffect(() => {
    const sse = new EventSource("/api/notificacoes/stream");
    sse.addEventListener("nova_mensagem_chat", (e) => {
      const msg = JSON.parse(e.data);
      setMensagens(prev => [...prev, msg]);
      if (!aberto && msg.usuario_email !== user?.email) setNaoLidas(n => n + 1);
    });
    sse.addEventListener("mensagem_deletada_chat", (e) => {
      const { id } = JSON.parse(e.data);
      setMensagens(prev => prev.filter(m => m.id !== id));
    });
    return () => sse.close();
  }, [aberto, user]);

  useEffect(() => {
    if (aberto) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens, aberto]);

  async function enviar() {
    if (!texto.trim()) return;
    try {
      await api.post("/chat", { usuario: user.nome, usuario_email: user.email, avatar: user.avatar || null, conteudo: texto.trim() });
      setTexto("");
      inputRef.current?.focus();
    } catch {}
  }

  async function deletar(id) {
    try { await api.delete(`/chat/${id}`, { data: { usuario_email: user.email } }); } catch {}
  }

  function formatarHora(iso) {
    return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <>
      {/* Botão flutuante */}
      <button onClick={() => { setAberto(a => !a); setNaoLidas(0); }} style={btnFlutStyle(tema)}>
        <IoChatbubbleEllipses size={22} />
        {naoLidas > 0 && (
          <span style={badgeStyle}>{naoLidas > 9 ? "9+" : naoLidas}</span>
        )}
      </button>

      {/* Janela */}
      {aberto && (
        <div style={janelaStyle(tema)}>
          {/* Header */}
          <div style={headerStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <IoChatbubbleEllipses size={16} color="white" />
              <span style={{ fontWeight: 700, fontSize: 14, color: "white" }}>Chat Interno</span>
            </div>
            <button onClick={() => setAberto(false)} style={btnFecharStyle}>
              <IoClose size={16} color="white" />
            </button>
          </div>

          {/* Mensagens */}
          <div style={msgsStyle(tema)}>
            {mensagens.length === 0 && (
              <div style={{ textAlign: "center", color: tema.textoMutado, fontSize: 13, marginTop: 40 }}>
                Nenhuma mensagem ainda.<br />Seja o primeiro a falar!
              </div>
            )}
            {mensagens.map((m) => {
              const minha = m.usuario_email === user?.email;
              return (
                <div key={m.id} style={{ display: "flex", flexDirection: "column", alignItems: minha ? "flex-end" : "flex-start", marginBottom: 10 }}>
                  {!minha && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                      <Avatar nome={m.usuario} avatar={m.avatar} size={22} />
                      <span style={{ fontSize: 11, color: tema.textoSecundario, fontWeight: 600 }}>{m.usuario}</span>
                      <span style={{ fontSize: 10, color: tema.textoMutado }}>{formatarHora(m.data)}</span>
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 4, flexDirection: minha ? "row-reverse" : "row" }}>
                    <div style={bolhaStyle(minha, tema)}>{m.conteudo}</div>
                    {minha && (
                      <button onClick={() => deletar(m.id)} title="Deletar" style={{ background: "none", border: "none", cursor: "pointer", color: tema.textoMutado, padding: "0 2px", opacity: 0.5, display: "flex", alignItems: "center" }}>
                        <IoTrash size={13} />
                      </button>
                    )}
                  </div>
                  {minha && <span style={{ fontSize: 10, color: tema.textoMutado, marginTop: 2 }}>{formatarHora(m.data)}</span>}
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={inputAreaStyle(tema)}>
            <input
              ref={inputRef}
              value={texto}
              onChange={e => setTexto(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && enviar()}
              placeholder="Digite uma mensagem..."
              style={inputStyle(tema)}
            />
            <button onClick={enviar} disabled={!texto.trim()} style={btnEnviarStyle}>
              <IoSend size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function Avatar({ nome, avatar, size = 28 }) {
  if (avatar?.startsWith("data:")) return <img src={avatar} alt="" style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: "#0A5C8E", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.45, fontWeight: 700, flexShrink: 0 }}>
      {nome?.charAt(0)?.toUpperCase()}
    </div>
  );
}

const btnFlutStyle = (tema) => ({ position: "fixed", bottom: 24, right: 24, width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg, #0A5C8E, #1a7ab8)", color: "white", border: "none", cursor: "pointer", zIndex: 9000, boxShadow: "0 4px 16px rgba(10,92,142,0.4)", display: "flex", alignItems: "center", justifyContent: "center", transition: "transform 0.2s" });
const badgeStyle = { position: "absolute", top: -4, right: -4, background: "#DC2626", color: "white", borderRadius: "50%", width: 18, height: 18, fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid white" };
const janelaStyle = (tema) => ({ position: "fixed", bottom: 86, right: 24, width: 320, height: 440, background: tema.cardBg, borderRadius: 18, boxShadow: "0 16px 48px rgba(0,0,0,0.2)", border: `1px solid ${tema.headerBorder}`, display: "flex", flexDirection: "column", zIndex: 9001, overflow: "hidden", fontFamily: "Inter, sans-serif" });
const headerStyle = { background: "linear-gradient(135deg, #0d1b2a, #0e3460)", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" };
const btnFecharStyle = { background: "rgba(255,255,255,0.15)", border: "none", width: 26, height: 26, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" };
const msgsStyle = (tema) => ({ flex: 1, overflowY: "auto", padding: "12px 14px", background: tema.pageBg });
const bolhaStyle = (minha, tema) => ({ maxWidth: 210, padding: "8px 12px", borderRadius: minha ? "16px 4px 16px 16px" : "4px 16px 16px 16px", background: minha ? "#0A5C8E" : tema.cardBg, color: minha ? "white" : tema.textoPrimario, fontSize: 13, lineHeight: 1.4, border: minha ? "none" : `1px solid ${tema.headerBorder}`, wordBreak: "break-word" });
const inputAreaStyle = (tema) => ({ display: "flex", gap: 8, padding: "10px 12px", borderTop: `1px solid ${tema.headerBorder}`, background: tema.cardBg });
const inputStyle = (tema) => ({ flex: 1, padding: "8px 12px", border: `1px solid ${tema.inputBorder}`, borderRadius: 20, fontSize: 13, outline: "none", background: tema.inputBg, color: tema.textoPrimario });
const btnEnviarStyle = { width: 36, height: 36, borderRadius: "50%", background: "#0A5C8E", color: "white", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 };