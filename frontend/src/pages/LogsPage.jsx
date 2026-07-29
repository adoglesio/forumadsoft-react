import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import api from "../services/api";

const TIPOS = [
  { valor: "", label: "Todos", cor: "#5C6F87", bg: "#F1F5F9" },
  { valor: "auth", label: "🔐 Login/Logout", cor: "#0A5C8E", bg: "#EFF7FF" },
  { valor: "erro", label: "🐛 Erros", cor: "#DC2626", bg: "#FFF5F5" },
  { valor: "comentario", label: "💬 Comentários", cor: "#22c55e", bg: "#F0FDF4" },
  { valor: "perfil", label: "👤 Perfil", cor: "#C26B2E", bg: "#FFFBEB" },
];

const ICONES = {
  login:               { icon: "🔓", cor: "#22c55e" },
  login_falhou:        { icon: "🚫", cor: "#DC2626" },
  logout:              { icon: "🔒", cor: "#5C6F87" },
  erro_criado:         { icon: "➕", cor: "#0A5C8E" },
  erro_editado:        { icon: "✏️",  cor: "#C26B2E" },
  erro_deletado:       { icon: "🗑️", cor: "#DC2626" },
  comentario_criado:   { icon: "💬", cor: "#22c55e" },
  comentario_editado:  { icon: "✏️",  cor: "#C26B2E" },
  comentario_deletado: { icon: "🗑️", cor: "#DC2626" },
  perfil_atualizado:   { icon: "👤", cor: "#0A5C8E" },
  senha_alterada:      { icon: "🔑", cor: "#C26B2E" },
};

export default function LogsPage({ onVoltar }) {
  const { user } = useAuth();
  const { tema } = useTheme();
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
    <div style={{ textAlign: "center", padding: 60, color: tema.textoMutado }}>
      <p style={{ fontSize: 40 }}>🔒</p>
      <p>Acesso restrito a administradores.</p>
      <button onClick={onVoltar} style={btnStyle}>Voltar</button>
    </div>
  );

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={onVoltar} style={btnOutlineStyle(tema)}>← Voltar</button>
          <h2 style={{ margin: 0, color: tema.textoPrimario, fontSize: 20, fontWeight: 700 }}>
            📋 Log de Atividades
          </h2>
        </div>
        <button onClick={limparLogs} style={{ ...btnOutlineStyle(tema), color: "#DC2626", borderColor: "#DC2626" }}>
          🗑️ Limpar logs
        </button>
      </div>

      {/* Filtros de tipo */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {TIPOS.map(t => (
          <button
            key={t.valor}
            onClick={() => setFiltroTipo(t.valor)}
            style={{
              padding: "6px 14px", borderRadius: 20, border: "none",
              cursor: "pointer", fontSize: 13, fontWeight: 600,
              background: filtroTipo === t.valor ? t.bg : tema.cardBg,
              color: filtroTipo === t.valor ? t.cor : tema.textoSecundario,
              outline: filtroTipo === t.valor ? `2px solid ${t.cor}` : `1px solid ${tema.inputBorder}`,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Busca */}
      <input
        placeholder="Buscar nos logs..."
        value={busca}
        onChange={e => setBusca(e.target.value)}
        style={{ width: "100%", padding: "10px 16px", borderRadius: 12, border: `1px solid ${tema.inputBorder}`, marginBottom: 16, fontSize: 14, outline: "none", background: tema.inputBg, color: tema.textoPrimario, boxSizing: "border-box" }}
      />

      {/* Contador */}
      <p style={{ color: tema.textoMutado, fontSize: 13, marginBottom: 12 }}>
        {logsFiltrados.length} registro{logsFiltrados.length !== 1 ? "s" : ""} encontrado{logsFiltrados.length !== 1 ? "s" : ""}
      </p>

      {/* Lista de logs */}
      {carregando ? (
        <div style={{ textAlign: "center", padding: 40, color: tema.textoMutado }}>Carregando...</div>
      ) : logsFiltrados.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: tema.textoMutado }}>Nenhum log encontrado.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {logsFiltrados.map(log => {
            const estilo = ICONES[log.acao] || { icon: "📌", cor: "#5C6F87" };
            return (
              <div key={log.id} style={{ background: tema.cardBg, border: `1px solid ${tema.headerBorder}`, borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "flex-start", gap: 12 }}>
                {/* Ícone */}
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: estilo.cor + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                  {estilo.icon}
                </div>

                {/* Conteúdo */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 600, fontSize: 14, color: tema.textoPrimario }}>{log.usuario}</span>
                    <span style={{ fontSize: 12, color: estilo.cor, background: estilo.cor + "18", padding: "2px 8px", borderRadius: 20 }}>{log.acao.replace(/_/g, " ")}</span>
                    {log.ip && <span style={{ fontSize: 11, color: tema.textoMutado }}>IP: {log.ip}</span>}
                  </div>
                  <p style={{ margin: "4px 0 0", fontSize: 13, color: tema.textoSecundario }}>{log.descricao}</p>
                </div>

                {/* Data */}
                <span style={{ fontSize: 11, color: tema.textoMutado, flexShrink: 0, whiteSpace: "nowrap" }}>
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

const btnStyle = { padding: "10px 24px", background: "#0A5C8E", color: "white", border: "none", borderRadius: 40, fontWeight: 600, cursor: "pointer" };
const btnOutlineStyle = (tema) => ({ padding: "8px 16px", background: "transparent", color: tema.textoSecundario, border: `1px solid ${tema.inputBorder}`, borderRadius: 40, cursor: "pointer", fontSize: 13 });