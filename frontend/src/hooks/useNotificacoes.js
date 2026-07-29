import { useEffect, useRef, useCallback } from "react";

export function useNotificacoes({ user, onErroClick }) {
  const sseRef = useRef(null);

  const exibirToast = useCallback((mensagem, tipo = "info") => {
    const estilos = {
      login:      { bg: "#EFF7FF", border: "#0A5C8E", icon: "🔔", titulo: "Novo acesso",      cor: "#0A5C8E" },
      erro:       { bg: "#FFF5F5", border: "#DC2626", icon: "🐛", titulo: "Novo erro",         cor: "#DC2626" },
      comentario: { bg: "#F0FDF4", border: "#22c55e", icon: "💬", titulo: "Novo comentário",   cor: "#22c55e" },
      info:       { bg: "#FFFBEB", border: "#C26B2E", icon: "ℹ️",  titulo: "Notificação",       cor: "#C26B2E" },
    };

    const s = estilos[tipo] || estilos.info;

    let c = document.getElementById("forum-toast-container");
    if (!c) {
      c = document.createElement("div");
      c.id = "forum-toast-container";
      Object.assign(c.style, {
        position: "fixed", top: "20px", right: "20px", zIndex: "99999",
        display: "flex", flexDirection: "column", gap: "10px",
        pointerEvents: "none", maxWidth: "360px",
      });
      document.body.appendChild(c);
    }

    if (!document.getElementById("toast-style")) {
      const style = document.createElement("style");
      style.id = "toast-style";
      style.textContent = `
        @keyframes slideInRight  { from { transform: translateX(120%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes slideOutRight { from { transform: translateX(0); opacity: 1; }    to { transform: translateX(120%); opacity: 0; } }
      `;
      document.head.appendChild(style);
    }

    const t = document.createElement("div");
    Object.assign(t.style, {
      background: s.bg, border: `1.5px solid ${s.border}`, borderRadius: "14px",
      padding: "14px 18px", display: "flex", alignItems: "flex-start", gap: "12px",
      boxShadow: "0 8px 24px rgba(0,0,0,.12)", pointerEvents: "all",
      animation: "slideInRight 0.3s ease", maxWidth: "360px",
    });

    t.innerHTML = `
      <span style="font-size:20px">${s.icon}</span>
      <div>
        <div style="font-size:13px;color:${s.cor};font-weight:600">${s.titulo}</div>
        <div style="font-size:13px;color:#1E2F3E">${mensagem}</div>
      </div>
      <button onclick="this.parentElement.remove()" style="background:none;border:none;cursor:pointer;color:#999;font-size:16px">×</button>
    `;

    c.appendChild(t);
    setTimeout(() => {
      t.style.animation = "slideOutRight 0.3s ease forwards";
      setTimeout(() => t.remove(), 300);
    }, 5000);
  }, []);

  const conectar = useCallback(() => {
    sseRef.current?.close();
    const sse = new EventSource("/api/notificacoes/stream");
    sseRef.current = sse;

    sse.addEventListener("novo_erro", (e) => {
      const d = JSON.parse(e.data);
      if (d.criador_nome === user?.nome) return;
      exibirToast(d.mensagem, "erro");
    });

    sse.addEventListener("novo_comentario", (e) => {
      const d = JSON.parse(e.data);
      if (d.usuario === user?.nome) return;
      exibirToast(d.mensagem, "comentario");
    });

    sse.onerror = () => setTimeout(() => { if (user) conectar(); }, 5000);
  }, [user, exibirToast]);

  useEffect(() => {
    if (!user) return;
    conectar();
    return () => { sseRef.current?.close(); };
  }, [user, conectar]);
}