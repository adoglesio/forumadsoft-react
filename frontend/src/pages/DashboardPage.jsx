import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { listarErros, carregarEstatisticas } from "../services/api";
import api from "../services/api";
import Header from "../components/Header";
import ErroCard from "../components/ErroCard";
import NovoErroModal from "../components/NovoErroModal";
import ErroDetailPage from "../components/ErroDetailPage";
import ProfilePage from "../components/ProfilePage";
import UsuariosOnline from "../components/UsuariosOnline";
import { useNotificacoes } from "../hooks/useNotificacoes";
import LogsPage from "../pages/LogsPage";
import Chat from "../components/Chat";
import GestaoUsuariosPage from "./GestaoUsuariosPage";
import { listarProdutos } from "../services/api";
import ToggleTema from "../components/ToggleTema";
import PerfilSidebar from "../components/PerfilSidebar";
import MigrarProdutosPage from "./MigrarProdutosPage";
import { FaRegFolderOpen } from "react-icons/fa";
import WidgetCopa from "../components/WidgetCopa"; // ← coluna esquerda, compacto

export default function DashboardPage() {
  const { user } = useAuth();
  const { tema, temaNome, setTemaNome, temas } = useTheme();
  const [erros, setErros] = useState([]);
  const [stats, setStats] = useState(null);
  const [filtro, setFiltro] = useState("");
  const [showNovo, setShowNovo] = useState(false);
  const [viewErroId, setViewErroId] = useState(null);
  const [viewPerfil, setViewPerfil] = useState(false);
  const [viewLogs, setViewLogs] = useState(false);
  const [viewGestao, setViewGestao] = useState(false);
  const [produtos, setProdutos] = useState([]);
  const [produtoFiltro, setProdutoFiltro] = useState("");
  const [viewMigrar, setViewMigrar] = useState(false);

  const carregar = useCallback(async () => {
    const [lista, estatisticas] = await Promise.all([
      listarErros(filtro, produtoFiltro ? String(produtoFiltro) : "", user?.email),
      carregarEstatisticas(),
    ]);
    setErros(lista);
    setStats(estatisticas);
  }, [filtro, produtoFiltro]);

  useEffect(() => { carregar(); }, [carregar]);
  useEffect(() => { listarProdutos().then(setProdutos).catch(() => {}); }, []);
  useEffect(() => {
    async function ping() {
      try { await api.post("/usuarios/ping", { email: user.email, nome: user.nome, avatar: user.avatar || null }); } catch {}
    }
    ping();
    const id = setInterval(ping, 30000);
    return () => clearInterval(id);
  }, [user]);

  useNotificacoes({ user, onErroClick: (id) => setViewErroId(id) });

  const SeletorTema = () => <ToggleTema />;

  // ── Sub-páginas ─────────────────────────────────────────────────────────────
  if (viewMigrar) return (
    <div style={{ minHeight: "100vh", background: tema.pageBg }}>
      <header style={{ background: tema.headerBg, borderBottom: `1px solid ${tema.headerBorder}`, padding: "12px 24px", position: "sticky", top: 0, zIndex: 100 }}>
        <span style={{ fontFamily: "Poppins,sans-serif", fontWeight: 700, color: tema.statCor1 }}>Dodô Forum</span>
      </header>
      <MigrarProdutosPage onVoltar={() => { setViewMigrar(false); carregar(); }} />
    </div>
  );

  if (viewGestao) return (
    <div style={{ minHeight: "100vh", background: tema.pageBg }}>
      <header style={{ background: tema.headerBg, borderBottom: `1px solid ${tema.headerBorder}`, padding: "12px 24px", position: "sticky", top: 0, zIndex: 100 }}>
        <span style={{ fontFamily: "Poppins,sans-serif", fontWeight: 700, color: tema.statCor1 }}>Dodô Forum</span>
      </header>
      <GestaoUsuariosPage onVoltar={() => setViewGestao(false)} />
    </div>
  );

  if (viewLogs) return (
    <div style={{ minHeight: "100vh", background: tema.pageBg }}>
      <header style={{ background: tema.headerBg, borderBottom: `1px solid ${tema.headerBorder}`, padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <span style={{ fontFamily: "Poppins,sans-serif", fontWeight: 700, color: tema.statCor1 }}>Dodô Forum</span>
      </header>
      <LogsPage onVoltar={() => setViewLogs(false)} />
    </div>
  );

  if (viewPerfil) return (
    <div style={{ minHeight: "100vh", background: tema.pageBg }}>
      <header style={{ background: tema.headerBg, borderBottom: `1px solid ${tema.headerBorder}`, padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <span style={{ fontFamily: "Poppins,sans-serif", fontWeight: 700, color: temaNome === "azul" ? "white" : tema.statCor1 }}>Dodô Forum</span>
        <SeletorTema />
      </header>
      <ProfilePage onVoltar={() => setViewPerfil(false)} />
    </div>
  );

  if (viewErroId !== null) return (
    <div style={{ minHeight: "100vh", background: tema.pageBg }}>
      <header style={{ background: tema.headerBg, borderBottom: `1px solid ${tema.headerBorder}`, padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => setViewErroId(null)} style={{ background: "none", border: "none", cursor: "pointer", color: temaNome === "azul" ? "white" : tema.statCor1, fontSize: 14, fontWeight: 600 }}>← Voltar</button>
          <span style={{ fontFamily: "Poppins,sans-serif", fontWeight: 700, color: temaNome === "azul" ? "white" : tema.statCor1 }}>Dodô Forum</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <SeletorTema />
          <button onClick={() => setShowNovo(true)} style={{ padding: "8px 16px", background: "#0A5C8E", color: "white", border: "none", borderRadius: 40, fontWeight: 600, cursor: "pointer", fontSize: 13 }}>+ Novo</button>
          <button onClick={() => setViewPerfil(true)} style={{ padding: "8px 16px", background: "transparent", border: `1px solid ${tema.inputBorder}`, borderRadius: 40, cursor: "pointer", fontSize: 13, color: tema.textoPrimario }}>Perfil</button>
        </div>
      </header>
      <ErroDetailPage erroId={viewErroId} onVoltar={() => setViewErroId(null)} onAtualizar={carregar} />
      {showNovo && <NovoErroModal onClose={() => setShowNovo(false)} onCriado={carregar} />}
      <Chat />
    </div>
  );

  // ── Dashboard principal 
  return (
    <div style={{ minHeight: "100vh", background: tema.pageBg }}>
      <Header
        stats={stats}
        onNovo={() => setShowNovo(true)}
        onPerfil={() => setViewPerfil(true)}
        onLogs={() => setViewLogs(true)}
        onGestao={() => setViewGestao(true)}
        onMigrar={() => setViewMigrar(true)}
        seletorTema={<SeletorTema />}
      />

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 16px", display: "flex", gap: 20 }}>

        {/* ── Coluna esquerda: perfil + widget Copa ──────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 0, flexShrink: 0 }}>
          <PerfilSidebar onEditarPerfil={() => setViewPerfil(true)} />
          {/* Widget Copa encaixado abaixo, mesma largura da sidebar */}
        <WidgetCopa />
        </div>

        {/* ── Coluna central: stats + filtros + lista de erros ───────────── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {stats && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
              {[
                { label: "Total de Erros", valor: stats.totalErros,       bg: tema.statBg1, cor: tema.statCor1 },
                { label: "Comentários",    valor: stats.totalComentarios, bg: tema.statBg2, cor: tema.statCor2 },
                { label: "Usuários",       valor: stats.totalUsuarios,    bg: tema.statBg3, cor: tema.statCor3 },
                { label: "Online agora",   valor: stats.usuariosOnline,   bg: tema.statBg4, cor: tema.statCor4 },
              ].map((s) => (
                <div key={s.label} style={{ background: s.bg, borderRadius: 14, padding: "16px 12px", textAlign: "center" }}>
                  <div style={{ fontSize: 26, fontWeight: 700, color: s.cor }}>{s.valor}</div>
                  <div style={{ fontSize: 12, color: tema.textoSecundario, marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Filtro por produto */}
          {produtos.length > 0 && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
              <button
                onClick={() => setProdutoFiltro("")}
                style={{ padding: "6px 16px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, background: !produtoFiltro ? tema.statBg1 : tema.cardBg, color: !produtoFiltro ? tema.statCor1 : tema.textoSecundario, outline: !produtoFiltro ? `2px solid ${tema.statCor1}` : `1px solid ${tema.inputBorder}` }}
              >
                <FaRegFolderOpen />
              </button>
              {produtos.map(p => (
                <button
                  key={p.id}
                  onClick={() => setProdutoFiltro(produtoFiltro === p.id ? "" : p.id)}
                  style={{ padding: "6px 16px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, background: produtoFiltro === p.id ? p.cor : tema.cardBg, color: produtoFiltro === p.id ? "white" : tema.textoSecundario, outline: produtoFiltro === p.id ? `2px solid ${p.cor}` : `1px solid ${tema.inputBorder}`, transition: "all 0.15s" }}
                >
                  {p.nome}
                </button>
              ))}
            </div>
          )}

          <input
            placeholder="Buscar por título ou descrição..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: `1px solid ${tema.inputBorder}`, marginBottom: 20, fontSize: 15, outline: "none", boxSizing: "border-box", background: tema.inputBg, color: tema.textoPrimario }}
          />

          {erros.length === 0
            ? (
              <div style={{ textAlign: "center", padding: 60, color: tema.textoMutado }}>
                <p>Nenhum erro encontrado.</p>
                <button onClick={() => setShowNovo(true)} style={{ padding: "10px 24px", background: "#0A5C8E", color: "white", border: "none", borderRadius: 40, fontWeight: 600, cursor: "pointer" }}>
                  + Reportar o primeiro
                </button>
              </div>
            )
            : erros.map((erro) => (
              <ErroCard key={erro.id} erro={erro} user={user} onAtualizar={carregar} onVerDetalhes={(id) => setViewErroId(id)} />
            ))
          }
        </div>

        {/* ── Coluna direita: usuários online ───────────────────────────── */}
        <UsuariosOnline />
      </div>
      

      {showNovo && <NovoErroModal onClose={() => setShowNovo(false)} onCriado={carregar} />}
      <Chat />
    </div>
  );
}