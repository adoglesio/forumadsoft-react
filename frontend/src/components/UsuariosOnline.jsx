import { useState, useEffect, useRef } from "react";
import api from "../services/api";
import { useTheme } from "../context/ThemeContext";
import LogoProduto from "./LogoProduto";

// ─── Popup de perfil ───────────────────────────────────────────────────────
function PerfilPopup({ usuario, onFechar }) {
  const { tema } = useTheme();
  const [perfil, setPerfil] = useState(null);
  const [erro, setErro] = useState(false);
  const [produtos, setProdutos] = useState([]);
  const popupRef = useRef();

  useEffect(() => {
    function handleClick(e) {
      if (popupRef.current && !popupRef.current.contains(e.target)) onFechar();
    }
    function handleKey(e) { if (e.key === "Escape") onFechar(); }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => { document.removeEventListener("mousedown", handleClick); document.removeEventListener("keydown", handleKey); };
  }, [onFechar]);

  useEffect(() => {
    api.get(`/usuarios/perfil-publico/${encodeURIComponent(usuario.email)}`)
      .then(r => setPerfil(r.data.data)).catch(() => setErro(true));
    api.get(`/produtos/usuario/${encodeURIComponent(usuario.email)}`)
      .then(async r => {
        const ids = r.data.data;
        const todos = await api.get('/produtos').then(p => p.data.data);
        setProdutos(todos.filter(p => ids.includes(p.id)));
      }).catch(() => {});
  }, [usuario.email]);

  const dataEntrada = perfil?.criado_em ? new Date(perfil.criado_em).toLocaleDateString("pt-BR") : null;

  return (
    <>
      <div onClick={onFechar} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 99997, backdropFilter: "blur(2px)" }} />
      <div ref={popupRef} style={{ position: "fixed", zIndex: 99998, background: tema.cardBg, borderRadius: 20, boxShadow: "0 24px 64px rgba(0,0,0,0.35)", border: `1px solid ${tema.headerBorder}`, width: 320, overflow: "hidden", left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}>
        <div style={{ background: "linear-gradient(135deg, #0d1117 0%, #161b22 50%, #0d2035 100%)", padding: "24px 20px 20px", position: "relative" }}>
          <button onClick={onFechar} style={{ position: "absolute", top: 12, right: 12, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)", width: 28, height: 28, borderRadius: "50%", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <AvatarComp nome={usuario.nome} avatar={perfil?.avatar ?? usuario.avatar} size={52} />
            <div>
              <div style={{ color: "white", fontWeight: 700, fontSize: 15 }}>{usuario.nome}</div>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, marginTop: 2 }}>{usuario.email}</div>
              {perfil?.isAdmin && (
                <span style={{ background: "linear-gradient(90deg,#f59e0b,#d97706)", color: "white", fontSize: 10, padding: "2px 8px", borderRadius: 20, fontWeight: 700, marginTop: 6, display: "inline-block", letterSpacing: 0.5 }}>ADMIN</span>
              )}
            </div>
          </div>
        </div>

        <div style={{ padding: "16px 20px" }}>
          {!perfil && !erro && (
            <div style={{ display: "flex", justifyContent: "center", padding: "20px 0" }}>
              <div style={{ width: 24, height: 24, border: `2px solid ${tema.headerBorder}`, borderTopColor: "#58a6ff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            </div>
          )}
          {erro && <p style={{ color: "#f85149", textAlign: "center", fontSize: 13 }}>Erro ao carregar perfil.</p>}
          {perfil && (
            <>
              {perfil.bio && (
                <div style={{ background: tema.pageBg, borderRadius: 8, padding: "8px 12px", marginBottom: 14, fontSize: 12, color: tema.textoSecundario, fontStyle: "italic", borderLeft: "3px solid #58a6ff" }}>
                  {perfil.bio}
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
                {[
                  { valor: perfil.errosReportados, label: "Erros", cor: "#58a6ff", bg: "rgba(88,166,255,0.08)" },
                  { valor: perfil.totalComentarios, label: "Comentários", cor: "#3fb950", bg: "rgba(63,185,80,0.08)" },
                ].map(s => (
                  <div key={s.label} style={{ background: s.bg, borderRadius: 10, padding: "10px", textAlign: "center", border: `1px solid ${s.cor}22` }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: s.cor, fontFamily: "monospace" }}>{s.valor}</div>
                    <div style={{ fontSize: 10, color: tema.textoMutado, marginTop: 2, textTransform: "uppercase", letterSpacing: 0.5 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {produtos.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: tema.textoMutado, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: 1 }}>Produtos</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {produtos.map(p => (
                      <div key={p.id} style={{ background: tema.pageBg, border: `1px solid ${tema.headerBorder}`, borderRadius: 6, padding: "3px 8px", display: "flex", alignItems: "center" }}>
                        <LogoProduto icone={p.icone} nome={p.nome} cor={p.cor} size="sm" style={{ height: 14, maxWidth: 60 }} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${tema.headerBorder}`, paddingTop: 10 }}>
                <span style={{ fontSize: 11, color: "#3fb950", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#3fb950", display: "inline-block" }} />
                  Online agora
                </span>
                {dataEntrada && <span style={{ fontSize: 10, color: tema.textoMutado }}>Membro desde {dataEntrada}</span>}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function AvatarComp({ nome, avatar, size = 36 }) {
  const cores = ["#1d6fa8", "#6d28d9", "#16A34A", "#b45309", "#b91c1c", "#0e7490"];
  const cor = cores[(nome?.charCodeAt(0) || 0) % cores.length];
  if (avatar?.startsWith("data:")) {
    return <img src={avatar} alt="" style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />;
  }
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: `linear-gradient(135deg, ${cor}, ${cor}aa)`, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.38, fontWeight: 700, flexShrink: 0, letterSpacing: -0.5 }}>
      {nome?.charAt(0)?.toUpperCase()}
    </div>
  );
}

// ─── Chip de produto tech ──────────────────────────────────────────────────
function ProdutoChip({ p, tema }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 4,
      background: tema.pageBg,
      border: `1px solid ${tema.headerBorder}`,
      borderRadius: 5, padding: "2px 7px",
      position: "relative", overflow: "hidden",
    }}>
      {/* barra colorida lateral */}
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 2, background: p.cor, borderRadius: "5px 0 0 5px" }} />
      <div style={{ paddingLeft: 4, overflow: "hidden", maxWidth: 72 }}>
        <LogoProduto icone={p.icone} nome={p.nome} cor={p.cor} size="sm" style={{ height: 13, maxWidth: 70, display: "block" }} />
      </div>
    </div>
  );
}

// ─── Componente principal ──────────────────────────────────────────────────
export default function UsuariosOnline() {
  const { tema } = useTheme();
  const [online, setOnline] = useState([]);
  const [selecionado, setSelecionado] = useState(null);
  const [produtosMap, setProdutosMap] = useState({});

  useEffect(() => {
    carregar();
    const id = setInterval(carregar, 10000);
    return () => clearInterval(id);
  }, []);

  async function carregar() {
    try {
      const { data } = await api.get("/usuarios/online");
      const lista = data.data || [];
      setOnline(lista);
      const todos = await api.get('/produtos').then(r => r.data.data);
      const map = {};
      await Promise.all(lista.map(async u => {
        try {
          const ids = await api.get(`/produtos/usuario/${encodeURIComponent(u.email)}`).then(r => r.data.data);
          map[u.email] = todos.filter(p => ids.includes(p.id));
        } catch { map[u.email] = []; }
      }));
      setProdutosMap(map);
    } catch {}
  }

  return (
    <>
      <aside style={{ width: 234, flexShrink: 0, alignSelf: "flex-start", position: "sticky", top: 80 }}>

        {/* Título — só "Online agora" sem contador de total */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, padding: "0 2px" }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#3fb950", boxShadow: "0 0 6px #3fb950" }} />
          <span style={{ fontWeight: 700, fontSize: 11, color: tema.textoMutado, textTransform: "uppercase", letterSpacing: 1.2 }}>
            Online agora
          </span>
          {online.length > 0 && (
            <span style={{ marginLeft: "auto", background: "rgba(63,185,80,0.12)", color: "#3fb950", fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 20, border: "1px solid rgba(63,185,80,0.25)", fontFamily: "monospace" }}>
              {online.length}
            </span>
          )}
        </div>

        {/* Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {online.length === 0 ? (
            <div style={{ background: tema.cardBg, borderRadius: 12, padding: "18px 14px", textAlign: "center", border: `1px solid ${tema.asideBorder}` }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>👻</div>
              <span style={{ color: tema.textoMutado, fontSize: 12 }}>Ninguém online ainda</span>
            </div>
          ) : (
            online.map(u => {
              const prods = produtosMap[u.email] || [];
              return (
                <div
                  key={u.email}
                  onClick={() => setSelecionado(u)}
                  style={{
                    background: tema.cardBg,
                    borderRadius: 12,
                    padding: "10px 12px",
                    border: `1px solid ${tema.asideBorder}`,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = tema.sidebarHover; e.currentTarget.style.borderColor = "#58a6ff44"; e.currentTarget.style.transform = "translateX(2px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = tema.cardBg; e.currentTarget.style.borderColor = tema.asideBorder; e.currentTarget.style.transform = "translateX(0)"; }}
                >
                  {/* Avatar + nome */}
                  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      <AvatarComp nome={u.nome} avatar={u.avatar} size={34} />
                      <span style={{ position: "absolute", bottom: 0, right: 0, width: 9, height: 9, borderRadius: "50%", background: "#3fb950", border: `2px solid ${tema.cardBg}`, boxShadow: "0 0 4px #3fb950" }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: tema.textoPrimario, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.nome}</div>
                    </div>
                  </div>

                  {/* Chips de produtos — tech */}
                  {prods.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8, paddingTop: 8, borderTop: `1px solid ${tema.headerBorder}` }}>
                      {prods.map(p => <ProdutoChip key={p.id} p={p} tema={tema} />)}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </aside>

      {selecionado && <PerfilPopup usuario={selecionado} onFechar={() => setSelecionado(null)} />}
    </>
  );
}