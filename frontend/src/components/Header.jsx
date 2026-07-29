import { useAuth } from "../context/AuthContext";
import { IoAdd, IoList, IoGrid, IoLink, IoLogOut } from "react-icons/io5";
import { useTheme } from "../context/ThemeContext";
import api from "../services/api";
import { CiFolderOn } from "react-icons/ci";

export default function Header({ stats, onNovo, onPerfil, onLogs, onGestao, onMigrar, seletorTema }) {
  const { user, logout } = useAuth();
  const { tema, temaNome } = useTheme();

  async function handleLogout() {
    try { await api.post("/usuarios/logout", { email: user.email }); } catch {}
    logout();
  }

  const isEscuro = temaNome === "escuro";

  const avatar = user?.avatar
    ? <img src={user.avatar} alt="" style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover", border: `2px solid ${tema.headerBorder}` }} />
    : <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#0A5C8E", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>{user?.nome?.charAt(0)?.toUpperCase()}</div>;

  return (
    <header style={{ background: tema.headerBg, borderBottom: `1px solid ${tema.headerBorder}`, padding: "10px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, boxShadow: isEscuro ? "0 1px 0 #21262d" : "0 1px 8px rgba(0,0,0,0.06)" }}>

      {/* Esquerda */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{ fontFamily: "Poppins, sans-serif", fontWeight: 800, fontSize: 18, color: isEscuro ? "#58a6ff" : "#0A5C8E", letterSpacing: -0.5 }}>
          Dodô Forum
        </span>
        {stats && (
          <div style={{ display: "flex", gap: 6 }}>
            <span style={{ background: tema.statBg1, color: tema.statCor1, fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: 600 }}>
              {stats.totalErros} erros
            </span>
            <span style={{ background: tema.statBg2, color: tema.statCor2, fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: 600 }}>
              {stats.usuariosOnline} online
            </span>
          </div>
        )}
      </div>

      {/* Direita */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {seletorTema}

        <button onClick={onNovo} style={{ padding: "7px 16px", background: isEscuro ? "#238636" : "#0A5C8E", color: "white", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
          + Novo Erro
        </button>

        {user?.isAdmin && (
          <>
            <button onClick={onLogs} style={btnSecStyle(tema)}><IoList size={14} style={{marginRight:4}} />Logs</button>
            <button onClick={onGestao} style={btnSecStyle(tema)}><IoGrid size={14} style={{marginRight:4}} />Produtos</button>
            <button onClick={onMigrar} style={{ ...btnSecStyle(tema), color: '#DC2626', borderColor: '#fecaca' }}><IoLink size={14} style={{marginRight:4}} />Vincular</button>
          </>
        )}

        <div onClick={onPerfil} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "4px 8px", borderRadius: 8, transition: "background 0.15s" }}
          onMouseEnter={e => e.currentTarget.style.background = tema.sidebarHover}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        >
          {avatar}
          <span style={{ fontSize: 13, color: tema.textoPrimario, fontWeight: 500, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.nome}</span>
        </div>

        <button onClick={handleLogout} style={{ ...btnSecStyle(tema), color: "#DC2626", borderColor: isEscuro ? "#3d1c1c" : "#fecaca" }}>
          Sair
        </button>
      </div>
    </header>
  );
}

const btnSecStyle = (tema) => ({
  padding: "6px 12px", background: "transparent",
  color: tema.textoSecundario, border: `1px solid ${tema.headerBorder}`,
  borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 500,
});