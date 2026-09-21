import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { IoLockClosedOutline, IoTrashOutline, IoDocumentTextOutline, IoSearch } from "react-icons/io5";

const TIPOS = [
  { valor: "", label: "Todos" },
  { valor: "auth", label: "🔐 Login/Logout" },
  { valor: "erro", label: "🐛 Erros" },
  { valor: "comentario", label: "💬 Comentários" },
  { valor: "perfil", label: "👤 Perfil" },
];

const ICONES = {
  login:               { icon: "🔓", cor: "var(--success)", bg: "var(--success-bg)" },
  login_falhou:        { icon: "🚫", cor: "var(--danger)",  bg: "var(--danger-bg)" },
  logout:              { icon: "🔒", cor: "var(--text-secondary)", bg: "var(--surface-alt)" },
  erro_criado:         { icon: "➕", cor: "var(--primary)", bg: "var(--primary-soft)" },
  erro_editado:        { icon: "✏️",  cor: "var(--warning)", bg: "var(--warning-bg)" },
  erro_deletado:       { icon: "🗑️", cor: "var(--danger)",  bg: "var(--danger-bg)" },
  comentario_criado:   { icon: "💬", cor: "var(--success)", bg: "var(--success-bg)" },
  comentario_editado:  { icon: "✏️",  cor: "var(--warning)", bg: "var(--warning-bg)" },
  comentario_deletado: { icon: "🗑️", cor: "var(--danger)",  bg: "var(--danger-bg)" },
  perfil_atualizado:   { icon: "👤", cor: "var(--primary)", bg: "var(--primary-soft)" },
  senha_alterada:      { icon: "🔑", cor: "var(--warning)", bg: "var(--warning-bg)" },
};
const PADRAO = { icon: "📌", cor: "var(--text-secondary)", bg: "var(--surface-alt)" };

export default function LogsPage({ onVoltar }) {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [filtroTipo, setFiltroTipo] = useState("");
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregar();
  }, [filtroTipo]);

  async function carregar() {
    setCarregando(true);
    try {
      const params = { limite: 200 };
      if (filtroTipo) params.tipo = filtroTipo;
      const r = await api.get("/logs", { params });
      setLogs(r.data.data);
    } catch {}
    setCarregando(false);
  }

  async function limparLogs() {
    if (!confirm("Tem certeza que deseja limpar todos os logs?")) return;
    await api.delete("/logs", { data: { usuario_email: user.email } });
    setLogs([]);
  }

  function formatarData(iso) {
    return new Date(iso).toLocaleString("pt-BR");
  }

  const logsFiltrados = logs.filter(l =>
    !busca || l.descricao.toLowerCase().includes(busca.toLowerCase()) ||
    l.usuario.toLowerCase().includes(busca.toLowerCase())
  );

  if (!user?.isAdmin) return (
    <div className="empty-state">
      <IoLockClosedOutline size={40} style={{ marginBottom: 8 }} />
      <p>Acesso restrito a administradores.</p>
      <button onClick={onVoltar} className="btn btn-primary">Voltar</button>
    </div>
  );

  return (
    <div className="app-narrow" style={{ maxWidth: 900 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <h2 style={{ margin: 0, color: "var(--text)", fontSize: 20, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
          <IoDocumentTextOutline size={20} /> Log de atividades
        </h2>
        <button onClick={limparLogs} className="btn btn-danger btn-sm">
          <IoTrashOutline size={14} /> Limpar logs
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {TIPOS.map(t => (
          <button
            key={t.valor}
            onClick={() => setFiltroTipo(t.valor)}
            className={`chip ${filtroTipo === t.valor ? "chip-active" : ""}`}
            style={{ background: filtroTipo === t.valor ? "var(--primary-soft)" : undefined, color: filtroTipo === t.valor ? "var(--primary)" : undefined }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ position: "relative", marginBottom: 16 }}>
        <IoSearch size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
        <input
          placeholder="Buscar nos logs..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          className="input"
          style={{ paddingLeft: 38 }}
        />
      </div>

      <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 12 }}>
        {logsFiltrados.length} registro{logsFiltrados.length !== 1 ? "s" : ""} encontrado{logsFiltrados.length !== 1 ? "s" : ""}
      </p>

      {carregando ? (
        <div className="empty-state"><div className="skeleton-spinner" /></div>
      ) : logsFiltrados.length === 0 ? (
        <div className="empty-state">Nenhum log encontrado.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {logsFiltrados.map(log => {
            const estilo = ICONES[log.acao] || PADRAO;
            return (
              <div key={log.id} className="card" style={{ padding: "12px 16px", display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: estilo.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>
                  {estilo.icon}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 600, fontSize: 14, color: "var(--text)" }}>{log.usuario}</span>
                    <span className="badge" style={{ color: estilo.cor, background: estilo.bg }}>{log.acao.replace(/_/g, " ")}</span>
                    {log.ip && <span style={{ fontSize: 11, color: "var(--text-muted)" }}>IP: {log.ip}</span>}
                  </div>
                  <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--text-secondary)" }}>{log.descricao}</p>
                </div>

                <span style={{ fontSize: 11, color: "var(--text-muted)", flexShrink: 0, whiteSpace: "nowrap" }}>
                  {formatarData(log.created_at)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
