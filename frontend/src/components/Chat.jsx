import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { supabase } from "../services/supabase";
import { IoChatbubbleEllipses, IoSend, IoTrash, IoClose } from "react-icons/io5";

export default function Chat() {
  const { user } = useAuth();
  const [aberto, setAberto] = useState(false);
  const [mensagens, setMensagens] = useState([]);
  const [texto, setTexto] = useState("");
  const [naoLidas, setNaoLidas] = useState(0);
  const bottomRef = useRef();
  const inputRef = useRef();
  const abertoRef = useRef(aberto);
  useEffect(() => { abertoRef.current = aberto; }, [aberto]);

  useEffect(() => {
    if (!aberto) return;
    api.get("/chat").then(r => setMensagens(r.data.data)).catch(() => {});
    setNaoLidas(0);
  }, [aberto]);

  // Tempo real via Supabase (substitui o antigo SSE) — assina uma única vez.
  useEffect(() => {
    const canal = supabase
      .channel("chat-forum")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat" }, (payload) => {
        const msg = payload.new;
        setMensagens(prev => [...prev, msg]);
        if (!abertoRef.current && msg.usuario_email !== user?.email) setNaoLidas(n => n + 1);
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "chat" }, (payload) => {
        const { id } = payload.old;
        setMensagens(prev => prev.filter(m => m.id !== id));
      })
      .subscribe();

    return () => { supabase.removeChannel(canal); };
  }, [user]);

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
      <button onClick={() => { setAberto(a => !a); setNaoLidas(0); }} style={btnFlutStyle} aria-label="Abrir chat interno">
        <IoChatbubbleEllipses size={22} />
        {naoLidas > 0 && (
          <span style={badgeStyle}>{naoLidas > 9 ? "9+" : naoLidas}</span>
        )}
      </button>

      {aberto && (
        <div style={janelaStyle} role="dialog" aria-label="Chat interno">
          <div style={headerStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <IoChatbubbleEllipses size={16} color="white" />
              <span style={{ fontWeight: 700, fontSize: 14, color: "white" }}>Chat Interno</span>
            </div>
            <button onClick={() => setAberto(false)} style={btnFecharStyle} aria-label="Fechar chat">
              <IoClose size={16} color="white" />
            </button>
          </div>

          <div style={msgsStyle}>
            {mensagens.length === 0 && (
              <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 13, marginTop: 40 }}>
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
                      <span style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 600 }}>{m.usuario}</span>
                      <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{formatarHora(m.data)}</span>
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 4, flexDirection: minha ? "row-reverse" : "row" }}>
                    <div style={bolhaStyle(minha)}>{m.conteudo}</div>
                    {minha && (
                      <button onClick={() => deletar(m.id)} title="Deletar" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "0 2px", opacity: 0.5, display: "flex", alignItems: "center" }}>
                        <IoTrash size={13} />
                      </button>
                    )}
                  </div>
                  {minha && <span style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>{formatarHora(m.data)}</span>}
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          <div style={inputAreaStyle}>
            <input
              ref={inputRef}
              value={texto}
              onChange={e => setTexto(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && enviar()}
              placeholder="Digite uma mensagem..."
              className="input"
              style={{ borderRadius: 20, padding: "8px 14px", fontSize: 13 }}
            />
            <button onClick={enviar} disabled={!texto.trim()} className="btn btn-primary btn-icon" style={{ borderRadius: "50%", flexShrink: 0 }}>
              <IoSend size={15} />
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
    <div style={{ width: size, height: size, borderRadius: "50%", background: "var(--primary)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.45, fontWeight: 700, flexShrink: 0 }}>
      {nome?.charAt(0)?.toUpperCase()}
    </div>
  );
}

const btnFlutStyle = { position: "fixed", bottom: 24, right: 24, width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg, #0A5C8E, #1a7ab8)", color: "white", border: "none", cursor: "pointer", zIndex: 9000, boxShadow: "0 4px 16px rgba(10,92,142,0.4)", display: "flex", alignItems: "center", justifyContent: "center", transition: "transform 0.2s" };
const badgeStyle = { position: "absolute", top: -4, right: -4, background: "var(--danger)", color: "white", borderRadius: "50%", width: 18, height: 18, fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid white" };
const janelaStyle = { position: "fixed", bottom: 86, right: 24, width: 320, maxWidth: "calc(100vw - 32px)", height: 440, maxHeight: "70vh", background: "var(--surface)", borderRadius: 18, boxShadow: "var(--shadow-pop)", border: "1px solid var(--border)", display: "flex", flexDirection: "column", zIndex: 9001, overflow: "hidden", fontFamily: "var(--font-body)", animation: "df-pop-in 0.18s ease" };
const headerStyle = { background: "linear-gradient(135deg, #0d1b2a, #0e3460)", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" };
const btnFecharStyle = { background: "rgba(255,255,255,0.15)", border: "none", width: 26, height: 26, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" };
const msgsStyle = { flex: 1, overflowY: "auto", padding: "12px 14px", background: "var(--bg)" };
const bolhaStyle = (minha) => ({ maxWidth: 210, padding: "8px 12px", borderRadius: minha ? "16px 4px 16px 16px" : "4px 16px 16px 16px", background: minha ? "var(--primary)" : "var(--surface)", color: minha ? "white" : "var(--text)", fontSize: 13, lineHeight: 1.4, border: minha ? "none" : "1px solid var(--border)", wordBreak: "break-word" });
const inputAreaStyle = { display: "flex", gap: 8, padding: "10px 12px", borderTop: "1px solid var(--border)", background: "var(--surface)" };
