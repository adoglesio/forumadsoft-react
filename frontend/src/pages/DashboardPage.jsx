import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { listarErros, carregarEstatisticas } from "../services/api";
import { supabase } from "../services/supabase";
import Header from "../components/Header";
import ErroCard from "../components/ErroCard";
import NovoErroModal from "../components/NovoErroModal";
import ErroDetailPage from "../components/ErroDetailPage";
import ProfilePage from "../components/ProfilePage";
import UsuariosOnline from "../components/UsuariosOnline";
import { useNotificacoes } from "../hooks/useNotificacoes";
import { useOnlineUsers } from "../hooks/useOnlineUsers";
import { iniciarPresence, pararPresence } from "../services/presence";
import LogsPage from "../pages/LogsPage";
import NotificacoesPage from "../pages/NotificacoesPage";
import GestaoUsuariosPage from "./GestaoUsuariosPage";
import { listarProdutos } from "../services/api";
import ToggleTema from "../components/ToggleTema";
import PerfilSidebar from "../components/PerfilSidebar";
import MigrarProdutosPage from "./MigrarProdutosPage";
import { FaRegFolderOpen } from "react-icons/fa";
import { IoArrowBack, IoSearch } from "react-icons/io5";
import ProcedimentosPage from "./ProcedimentosPage";

function SubPageHeader({ titulo, onVoltar, direita }) {
  return (
    <header className="app-header" style={{ padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        {onVoltar && (
          <button onClick={onVoltar} className="btn btn-ghost btn-sm">
            <IoArrowBack size={14} /> Voltar
          </button>
        )}
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, color: "var(--primary)", fontSize: 16, letterSpacing: -0.3 }}>
          {titulo || "Dodô Forum"}
        </span>
      </div>
      {direita}
    </header>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { tema } = useTheme();
  const [erros, setErros] = useState([]);
  const [stats, setStats] = useState(null);
  const [filtro, setFiltro] = useState("");
  const [showNovo, setShowNovo] = useState(false);
  const [viewErroId, setViewErroId] = useState(null);
  const [viewPerfil, setViewPerfil] = useState(false);
  const [viewLogs, setViewLogs] = useState(false);
  const [viewGestao, setViewGestao] = useState(false);
  const [viewMigrar, setViewMigrar] = useState(false);
  const [viewProcedimentos, setViewProcedimentos] = useState(false);
  const [viewNotificacoes, setViewNotificacoes] = useState(false);
  const [produtos, setProdutos] = useState([]);
  const [produtoFiltro, setProdutoFiltro] = useState("");
  const [carregandoErros, setCarregandoErros] = useState(true);

  // Contador de novas notificações — zera ao abrir o painel
  const [novasNotif, setNovasNotif] = useState(0);
  const viewNotifRef = useRef(viewNotificacoes);
  useEffect(() => { viewNotifRef.current = viewNotificacoes; }, [viewNotificacoes]);

  useEffect(() => {
    if (!user) return;
    const canal = supabase
      .channel("dashboard-notif-counter")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "logs" }, (payload) => {
        if (!viewNotifRef.current && payload.new?.usuario_email !== user.email) {
          setNovasNotif(n => n + 1);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(canal); };
  }, [user]);

  function abrirNotificacoes() {
    setNovasNotif(0);
    setViewNotificacoes(true);
  }

  const carregar = useCallback(async () => {
    setCarregandoErros(true);
    try {
      const [lista, estatisticas] = await Promise.all([
        listarErros(filtro, produtoFiltro ? String(produtoFiltro) : "", user?.email),
        carregarEstatisticas(),
      ]);
      setErros(lista);
      setStats(estatisticas);
    } finally {
      setCarregandoErros(false);
    }
  }, [filtro, produtoFiltro]);

  useEffect(() => { carregar(); }, [carregar]);
  useEffect(() => { listarProdutos().then(setProdutos).catch(() => {}); }, []);

  useEffect(() => {
    if (!user) return;
    iniciarPresence(user);
    return () => pararPresence();
  }, [user]);

  const online = useOnlineUsers();
  const statsComOnline = stats ? { ...stats, usuariosOnline: online.length } : stats;

  useNotificacoes({ user, onErroClick: (id) => setViewErroId(id) });

  const SeletorTema = () => <ToggleTema />;

  // Sub-páginas
  if (viewMigrar) return (
    <div className="app-shell">
      <SubPageHeader onVoltar={null} />
      <MigrarProdutosPage onVoltar={() => { setViewMigrar(false); carregar(); }} />
    </div>
  );

  if (viewGestao) return (
    <div className="app-shell">
      <SubPageHeader onVoltar={() => setViewGestao(false)} direita={<SeletorTema />} />
      <GestaoUsuariosPage onVoltar={() => setViewGestao(false)} />
    </div>
  );

  if (viewLogs) return (
    <div className="app-shell">
      <SubPageHeader />
      <LogsPage onVoltar={() => setViewLogs(false)} />
    </div>
  );

  if (viewNotificacoes) return (
    <div className="app-shell">
      <SubPageHeader onVoltar={() => setViewNotificacoes(false)} direita={<SeletorTema />} />
      <NotificacoesPage onVoltar={() => setViewNotificacoes(false)} />
    </div>
  );

  if (viewProcedimentos) return (
    <div className="app-shell">
      <SubPageHeader onVoltar={() => setViewProcedimentos(false)} direita={<SeletorTema />} />
      <ProcedimentosPage />
    </div>
  );

  if (viewPerfil) return (
    <div className="app-shell">
      <SubPageHeader onVoltar={() => setViewPerfil(false)} direita={<SeletorTema />} />
      <ProfilePage onVoltar={() => setViewPerfil(false)} />
    </div>
  );

  if (viewErroId !== null) return (
    <div className="app-shell">
      <SubPageHeader
        onVoltar={() => setViewErroId(null)}
        direita={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <SeletorTema />
            <button onClick={() => setShowNovo(true)} className="btn btn-primary btn-sm">+ Novo</button>
            <button onClick={() => setViewPerfil(true)} className="btn btn-secondary btn-sm">Perfil</button>
          </div>
        }
      />
      <ErroDetailPage erroId={viewErroId} onVoltar={() => setViewErroId(null)} onAtualizar={carregar} />
      {showNovo && <NovoErroModal onClose={() => setShowNovo(false)} onCriado={carregar} />}
    </div>
  );

  return (
    <div className="app-shell">
      <Header
        stats={statsComOnline}
        onNovo={() => setShowNovo(true)}
        onPerfil={() => setViewPerfil(true)}
        onLogs={() => setViewLogs(true)}
        onGestao={() => setViewGestao(true)}
        onMigrar={() => setViewMigrar(true)}
        onProcedimentos={() => setViewProcedimentos(true)}
        onNotificacoes={abrirNotificacoes}
        totalNotificacoes={novasNotif}
        seletorTema={<SeletorTema />}
      />

      <div className="app-content">
        <div className="app-aside-left" style={{ display: "flex", flexDirection: "column", gap: 12, flexShrink: 0, width: 236 }}>
          <PerfilSidebar onEditarPerfil={() => setViewPerfil(true)} />
        </div>

        <div className="app-main" style={{ minWidth: 0 }}>
          {statsComOnline && (
            <div className="stat-grid">
              {[
                { label: "Total de Erros",  valor: statsComOnline.totalErros,       bg: tema.statBg1, cor: tema.statCor1 },
                { label: "Comentários",     valor: statsComOnline.totalComentarios, bg: tema.statBg2, cor: tema.statCor2 },
                { label: "Usuários",        valor: statsComOnline.totalUsuarios,    bg: tema.statBg3, cor: tema.statCor3 },
                { label: "Online agora",    valor: statsComOnline.usuariosOnline,   bg: tema.statBg4, cor: tema.statCor4 },
              ].map((s) => (
                <div key={s.label} className="stat-card" style={{ background: s.bg }}>
                  <div className="stat-card-value" style={{ color: s.cor }}>{s.valor}</div>
                  <div className="stat-card-label">{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {produtos.length > 0 && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
              <button
                onClick={() => setProdutoFiltro("")}
                className={`chip ${!produtoFiltro ? "chip-active" : ""}`}
                style={{ background: !produtoFiltro ? tema.statBg1 : undefined, color: !produtoFiltro ? tema.statCor1 : undefined }}
                title="Todos os produtos"
              >
                <FaRegFolderOpen />
              </button>
              {produtos.map(p => (
                <button
                  key={p.id}
                  onClick={() => setProdutoFiltro(produtoFiltro === p.id ? "" : p.id)}
                  className={`chip ${produtoFiltro === p.id ? "chip-active" : ""}`}
                  style={{ background: produtoFiltro === p.id ? p.cor : undefined, color: produtoFiltro === p.id ? "white" : undefined }}
                >
                  {p.nome}
                </button>
              ))}
            </div>
          )}

          <div style={{ position: "relative", marginBottom: 20 }}>
            <IoSearch size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              placeholder="Buscar por título ou descrição..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="input"
              style={{ paddingLeft: 38 }}
            />
          </div>

          {carregandoErros ? (
            <div className="empty-state"><div className="skeleton-spinner" /></div>
          ) : erros.length === 0 ? (
            <div className="empty-state">
              <p style={{ marginBottom: 16 }}>Nenhum erro encontrado.</p>
              <button onClick={() => setShowNovo(true)} className="btn btn-primary">+ Reportar o primeiro</button>
            </div>
          ) : (
            erros.map((erro) => (
              <ErroCard key={erro.id} erro={erro} user={user} onAtualizar={carregar} onVerDetalhes={(id) => setViewErroId(id)} />
            ))
          )}
        </div>

        <div className="app-aside-right">
          <UsuariosOnline />
        </div>
      </div>

      {showNovo && <NovoErroModal onClose={() => setShowNovo(false)} onCriado={carregar} />}
    </div>
  );
}
