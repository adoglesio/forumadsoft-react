import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../services/supabase";
import api from "../services/api";
import {
  IoBellOutline, IoArrowBack, IoSearchOutline,
  IoTrashOutline, IoCheckmarkDoneOutline,
} from "react-icons/io5";

// ── Configuração visual por tipo de ação ────────────────────────────────────
const ESTILOS = {
  login:               { icon: "🔓", label: "login",               cor: "#22c55e", bg: "#F0FDF4" },
  login_falhou:        { icon: "🚫", label: "login falhou",        cor: "#DC2626", bg: "#FFF5F5" },
  logout:              { icon: "🔒", label: "logout",              cor: "#6B7280", bg: "#F3F4F6" },
  erro_criado:         { icon: "🐛", label: "erro criado",         cor: "#0A5C8E", bg: "#EFF7FF" },
  erro_editado:        { icon: "✏️",  label: "erro editado",        cor: "#D97706", bg: "#FFFBEB" },
  erro_deletado:       { icon: "🗑️", label: "erro deletado",       cor: "#DC2626", bg: "#FFF5F5" },
  comentario_criado:   { icon: "💬", label: "comentario criado",   cor: "#22c55e", bg: "#F0FDF4" },
  comentario_editado:  { icon: "✏️",  label: "comentario editado",  cor: "#D97706", bg: "#FFFBEB" },
  comentario_deletado: { icon: "🗑️", label: "comentario deletado", cor: "#DC2626", bg: "#FFF5F5" },
  perfil_atualizado:   { icon: "👤", label: "perfil atualizado",   cor: "#0A5C8E", bg: "#EFF7FF" },
  senha_alterada:      { icon: "🔑", label: "senha alterada",      cor: "#D97706", bg: "#FFFBEB" },
  procedimento_criado: { icon: "📋", label: "procedimento criado", cor: "#7C3AED", bg: "#F5F3FF" },
  procedimento_deletado:{ icon:"🗑️", label: "procedimento deletado",cor: "#DC2626", bg: "#FFF5F5" },
};
const PADRAO = { icon: "📌", label: "ação", cor: "#6B7280", bg: "#F3F4F6" };

const FILTROS = [
  { valor: "",          label: "Todos" },
  { valor: "auth",      label: "🔐 Login" },
  { valor: "erro",      label: "🐛 Erros" },
  { valor: "comentario",label: "💬 Comentários" },
  { valor: "perfil",    label: "👤 Perfil" },
];

function formatarTempo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const min  = Math.floor(diff / 60000);
  const h    = Math.floor(diff / 3600000);
  const d    = Math.floor(diff / 86400000);
  if (min < 1)  return "agora";
  if (min < 60) return `${min}min atrás`;
  if (h < 24)   return `${h}h atrás`;
  if (d < 7)    return `${d}d atrás`;
  return new Date(iso).toLocaleDateString("pt-BR");
}

function formatarDataCompleta(iso) {
  return new Date(iso).toLocaleString("pt-BR");
}

function AvatarLetra({ nome, avatar, size = 38 }) {
  if (avatar) return (
    <img src={avatar} alt="" style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
  );
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "var(--primary)", color: "white",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 700, fontSize: size * 0.38, flexShrink: 0,
    }}>
      {nome?.charAt(0)?.toUpperCase() || "?"}
    </div>
  );
}

export default function NotificacoesPage({ onVoltar }) {
  const { user } = useAuth();
  const [logs, setLogs]           = useState([]);
  const [busca, setBusca]         = useState("");
  const [filtro, setFiltro]       = useState("");
  const [carregando, setCarregando] = useState(true);
  const [novos, setNovos]         = useState(new Set()); // ids recém chegados via realtime
  const usuariosCache             = useRef({});          // cache email→{nome,avatar}

  // ── Busca avatares dos usuários para exibir nos logs 
  async function enriquecerLogs(lista) {
    const emails = [...new Set(lista.map(l => l.usuario_email).filter(Boolean))];
    const faltam = emails.filter(e => !usuariosCache.current[e]);

    if (faltam.length > 0) {
      try {
        const r = await api.get("/usuarios/lista-basica", { params: { emails: faltam.join(",") } });
        (r.data.data || []).forEach(u => { usuariosCache.current[u.email] = u; });
      } catch {
        // sem avatares não quebra nada
      }
    }
    return lista.map(l => ({
      ...l,
      _avatar: usuariosCache.current[l.usuario_email]?.avatar || null,
    }));
  }

  // ── Carrega histórico 
  async function carregar() {
    setCarregando(true);
    try {
      const params = { limite: 300 };
      if (filtro) params.tipo = filtro;
      const r = await api.get("/logs", { params });
      const enriquecidos = await enriquecerLogs(r.data.data || []);
      setLogs(enriquecidos);
    } catch {}
    setCarregando(false);
  }

  useEffect(() => { carregar(); }, [filtro]);

  // ── Tempo real: novos logs via Supabase Realtime 
  useEffect(() => {
    if (!user) return;

    const canal = supabase
      .channel("notificacoes-logs")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "logs" },
        async (payload) => {
          const novo = payload.new;
          // Enriquece com avatar
          const enriquecido = (await enriquecerLogs([novo]))[0];
          setLogs(prev => [enriquecido, ...prev]);
          setNovos(prev => new Set([...prev, enriquecido.id]));
          // Remove destaque após 4s
          setTimeout(() => setNovos(prev => { const s = new Set(prev); s.delete(enriquecido.id); return s; }), 4000);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(canal); };
  }, [user]);

  // ── Limpar todos os logs 
  async function limparLogs() {
    if (!confirm("Limpar todos os logs? Esta ação não pode ser desfeita.")) return;
    await api.delete("/logs", { data: { usuario_email: user.email } });
    setLogs([]);
  }

  // ── Filtro de busca local 
  const logsFiltrados = logs.filter(l => {
    if (!busca) return true;
    const b = busca.toLowerCase();
    return (
      l.descricao?.toLowerCase().includes(b) ||
      l.usuario?.toLowerCase().includes(b) ||
      l.ip?.includes(b)
    );
  });

  return (
    <div style={{ maxWidth: 780, margin: "0 auto", padding: "0 16px 40px" }}>

      {/* ── Cabeçalho ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 0 18px", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--primary-soft)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <IoBellOutline size={20} color="var(--primary)" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--text)" }}>Notificações</h2>
            <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)" }}>{logsFiltrados.length} registro{logsFiltrados.length !== 1 ? "s" : ""}</p>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {user?.isAdmin && (
            <button onClick={limparLogs} className="btn btn-danger btn-sm">
              <IoTrashOutline size={14} /> Limpar
            </button>
          )}
          <button onClick={onVoltar} className="btn btn-secondary btn-sm">
            <IoArrowBack size={14} /> Voltar
          </button>
        </div>
      </div>

      {/* ── Busca + filtros ── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <IoSearchOutline size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            className="input"
            placeholder="Filtro e pesquisa"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            style={{ paddingLeft: 34, height: 36 }}
          />
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {FILTROS.map(f => (
            <button
              key={f.valor}
              onClick={() => setFiltro(f.valor)}
              className={`chip ${filtro === f.valor ? "chip-active" : ""}`}
              style={filtro === f.valor ? { background: "var(--primary-soft)", color: "var(--primary)" } : {}}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Lista ── */}
      {carregando ? (
        <div className="empty-state"><div className="skeleton-spinner" /></div>
      ) : logsFiltrados.length === 0 ? (
        <div className="empty-state">
          <IoBellOutline size={36} style={{ marginBottom: 8, opacity: 0.3 }} />
          <p style={{ color: "var(--text-muted)" }}>Nenhuma notificação encontrada.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {logsFiltrados.map(log => {
            const estilo = ESTILOS[log.acao] || PADRAO;
            const isNovo = novos.has(log.id);

            return (
              <div
                key={log.id}
                className="card"
                style={{
                  padding: "12px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  transition: "background 0.3s",
                  background: isNovo ? "var(--primary-soft)" : "var(--surface)",
                  borderLeft: isNovo ? `3px solid var(--primary)` : "3px solid transparent",
                }}
              >
                {/* Avatar */}
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <AvatarLetra nome={log.usuario} avatar={log._avatar} size={38} />
                  <div style={{
                    position: "absolute", bottom: -2, right: -2,
                    width: 18, height: 18, borderRadius: "50%",
                    background: estilo.bg,
                    border: "2px solid var(--surface)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 9,
                  }}>
                    {estilo.icon}
                  </div>
                </div>

                {/* Conteúdo */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 2 }}>
                    <span style={{ fontWeight: 600, fontSize: 14, color: "var(--text)" }}>{log.usuario}</span>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20,
                      color: estilo.cor, background: estilo.bg,
                    }}>
                      {estilo.label}
                    </span>
                    {log.ip && (
                      <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "monospace" }}>
                        IP: {log.ip}
                      </span>
                    )}
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {log.descricao}
                  </p>
                </div>

                {/* Data */}
                <div style={{ flexShrink: 0, textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                    {formatarDataCompleta(log.created_at)}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--primary)", marginTop: 2 }}>
                    {formatarTempo(log.created_at)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}