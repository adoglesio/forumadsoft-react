import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import LogoProduto from "./LogoProduto";
import { IoPencil } from "react-icons/io5";
import { useState, useEffect } from "react";
import api from "../services/api";

export default function PerfilSidebar({ onEditarPerfil }) {
  const { user } = useAuth();
  const { tema, temaNome } = useTheme();
  const [produtos, setProdutos] = useState([]);

  useEffect(() => {
    async function carregar() {
      try {
        const ids = await api.get(`/produtos/usuario/${encodeURIComponent(user.email)}`).then(r => r.data.data);
        const todos = await api.get('/produtos').then(r => r.data.data);
        setProdutos(todos.filter(p => ids.includes(p.id)));
      } catch {}
    }
    if (user?.email) carregar();
  }, [user]);

  const isEscuro = temaNome === "escuro";

  return (
    <aside style={{
      width: 220, flexShrink: 0,
      alignSelf: "flex-start",
      position: "sticky", top: 80,
      display: "flex", flexDirection: "column", gap: 12,
    }}>
      {/* Card do perfil */}
      <div style={{ background: tema.cardBg, borderRadius: 16, overflow: "hidden", border: `1px solid ${tema.asideBorder}`, boxShadow: tema.cardSombra }}>

        {/* Banner */}
        <div style={{
          height: 72,
          background: isEscuro
            ? "linear-gradient(135deg, #0d2035 0%, #0d1117 100%)"
            : "linear-gradient(135deg, #0A5C8E 0%, #1a7ab8 100%)",
        }} />

        {/* Avatar */}
        <div style={{ padding: "0 16px 16px", marginTop: -28 }}>
          <div style={{ marginBottom: 10 }}>
            {user?.avatar
              ? <img src={user.avatar} alt="" style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", border: `3px solid ${tema.cardBg}`, boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }} />
              : <div style={{ width: 56, height: 56, borderRadius: "50%", background: isEscuro ? "#58a6ff" : "#0A5C8E", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 22, border: `3px solid ${tema.cardBg}` }}>
                  {user?.nome?.charAt(0)?.toUpperCase()}
                </div>
            }
          </div>

          <div style={{ fontWeight: 700, fontSize: 15, color: tema.textoPrimario, marginBottom: 2 }}>{user?.nome}</div>
          <div style={{ fontSize: 12, color: tema.textoMutado, marginBottom: user?.bio ? 8 : 12 }}>{user?.email}</div>

          {user?.bio && (
            <p style={{ fontSize: 12, color: tema.textoSecundario, margin: "0 0 12px", lineHeight: 1.5 }}>{user.bio}</p>
          )}

          {user?.isAdmin && (
            <span style={{ background: "gold", color: "#333", fontSize: 10, padding: "2px 10px", borderRadius: 20, fontWeight: 700, display: "inline-block", marginBottom: 12 }}>
              Administrador
            </span>
          )}

          <button
            onClick={onEditarPerfil}
            style={{
              width: "100%", padding: "7px 0",
              background: "transparent",
              border: `1px solid ${tema.headerBorder}`,
              borderRadius: 8, cursor: "pointer",
              fontSize: 12, fontWeight: 600,
              color: tema.textoSecundario,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              transition: "all 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = tema.sidebarHover; e.currentTarget.style.color = tema.textoPrimario; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = tema.textoSecundario; }}
          >
            <IoPencil size={12} style={{marginRight:4}} />Editar seu perfil
          </button>
        </div>
      </div>

      {/* Card de produtos */}
      {produtos.length > 0 && (
        <div style={{ background: tema.cardBg, borderRadius: 16, padding: "14px 16px", border: `1px solid ${tema.asideBorder}`, boxShadow: tema.cardSombra }}>
          <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 700, color: tema.textoMutado, textTransform: "uppercase", letterSpacing: 0.8 }}>Meus Produtos</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {produtos.map(p => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 8, background: tema.pageBg, border: `1px solid ${tema.headerBorder}` }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.cor, flexShrink: 0 }} />
                <LogoProduto icone={p.icone} nome={p.nome} cor={p.cor} size="sm" style={{ height: 16, maxWidth: 80 }} />
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}