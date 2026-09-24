import { useAuth } from "../context/AuthContext";
import { IoList, IoGrid, IoLink } from "react-icons/io5";
import { useTheme } from "../context/ThemeContext";
import { pararPresence } from "../services/presence";

export default function Header({ stats, onNovo, onPerfil, onLogs, onGestao, onMigrar, onProcedimentos, seletorTema }) {
  const { user, logout } = useAuth();
  const { tema } = useTheme();

  function handleLogout() {
    pararPresence();
    logout();
  }

  const avatar = user?.avatar
    ? <img src={user.avatar} alt="" style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", border: `2px solid var(--border)` }} />
    : <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--primary)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{user?.nome?.charAt(0)?.toUpperCase()}</div>;

  return (
    <header className="app-header" style={{ padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>

      <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18, color: "var(--primary)", letterSpacing: -0.3, flexShrink: 0 }}>
          Dodô Forum
        </span>
        {stats && (
          <div className="app-header-brand-stats" style={{ display: "flex", gap: 6 }}>
            <span className="badge" style={{ background: "var(--stat-1-bg, var(--primary-soft))", color: "var(--primary)" }}>
              {stats.totalErros} erros
            </span>
            <span className="badge" style={{ background: "var(--success-bg)", color: "var(--success)" }}>
              {stats.usuariosOnline} online
            </span>
          </div>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
        {seletorTema}

        <button onClick={onNovo} className="btn btn-primary">
          + Novo Erro
        </button>

        <button onClick={onProcedimentos} className="btn btn-secondary btn-sm">Procedimentos</button>

        {user?.isAdmin && (
          <>
            <button onClick={onLogs} className="btn btn-secondary btn-sm">
              <IoList size={13} /> <span className="app-header-actions-label">Logs</span>
            </button>
            <button onClick={onGestao} className="btn btn-secondary btn-sm">
              <IoGrid size={13} /> <span className="app-header-actions-label">Produtos</span>
            </button>
            <button onClick={onMigrar} className="btn btn-danger btn-sm">
              <IoLink size={13} /> <span className="app-header-actions-label">Vincular</span>
            </button>
          </>
        )}

        <div
          onClick={onPerfil}
          style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "4px 8px", borderRadius: 8, transition: "background 0.15s" }}
          onMouseEnter={e => e.currentTarget.style.background = tema.sidebarHover}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        >
          {avatar}
          <span className="app-header-actions-label" style={{ fontSize: 13, color: "var(--text)", fontWeight: 500, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.nome}</span>
        </div>

        <button onClick={handleLogout} className="btn btn-danger btn-sm">
          Sair
        </button>
      </div>
    </header>
  );
}
