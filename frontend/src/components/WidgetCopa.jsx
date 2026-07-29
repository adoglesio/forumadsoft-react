import { useState, useEffect, useCallback } from "react";

// ── Lista de seleções que participam da Copa do Mundo 2026 ──────────
const WORLD_CUP_TEAMS = new Set([
  // Grupo A
  "Mexico", "South Africa", "Trinidad and Tobago", "Saudi Arabia",
  // Grupo B
  "Argentina", "Chile", "Peru", "Albania",
  // Grupo C
  "Brasil", "Morocco", "Haiti", "Scotland",
  // Grupo D
  "France", "Uruguay", "Algeria", "Czechia",
  // Grupo E
  "Spain", "Japan", "Senegal", "Ecuador",
  // Grupo F
  "Germany", "Colombia", "Egypt", "New Zealand",
  // Grupo G
  "Portugal", "DR Congo", "Austria", "Jordan",
  // Grupo H
  "Netherlands", "South Korea", "Cameroon", "Honduras",
  // Grupo I
  "England", "Serbia", "Panama",
  // Grupo J
  "USA", "Nigeria", "Ghana", "Ukraine",
  // Grupo K
  "Canada", "Qatar", "Venezuela", "Slovakia",
  // Grupo L
  "Switzerland", "Bosnia & Herzegovina", "Ivory Coast", "Iraq",
]);

// ── Mapa de bandeiras com imagens ─────────────────────────────────────
const FLAG_IMAGES = {
  // Grupo A
  "Mexico": "https://flagcdn.com/w40/mx.png",
  "South Africa": "https://flagcdn.com/w40/za.png",
  "Trinidad and Tobago": "https://flagcdn.com/w40/tt.png",
  "Saudi Arabia": "https://flagcdn.com/w40/sa.png",
  // Grupo B
  "Argentina": "https://flagcdn.com/w40/ar.png",
  "Chile": "https://flagcdn.com/w40/cl.png",
  "Peru": "https://flagcdn.com/w40/pe.png",
  "Albania": "https://flagcdn.com/w40/al.png",
  // Grupo C
  "Brasil": "https://flagcdn.com/w40/br.png",
  "Morocco": "https://flagcdn.com/w40/ma.png",
  "Haiti": "https://flagcdn.com/w40/ht.png",
  "Scotland": "https://flagcdn.com/w40/gb-sct.png",
  // Grupo D
  "France": "https://flagcdn.com/w40/fr.png",
  "Uruguay": "https://flagcdn.com/w40/uy.png",
  "Algeria": "https://flagcdn.com/w40/dz.png",
  "Czechia": "https://flagcdn.com/w40/cz.png",
  // Grupo E
  "Spain": "https://flagcdn.com/w40/es.png",
  "Japan": "https://flagcdn.com/w40/jp.png",
  "Senegal": "https://flagcdn.com/w40/sn.png",
  "Ecuador": "https://flagcdn.com/w40/ec.png",
  // Grupo F
  "Germany": "https://flagcdn.com/w40/de.png",
  "Colombia": "https://flagcdn.com/w40/co.png",
  "Egypt": "https://flagcdn.com/w40/eg.png",
  "New Zealand": "https://flagcdn.com/w40/nz.png",
  // Grupo G
  "Portugal": "https://flagcdn.com/w40/pt.png",
  "DR Congo": "https://flagcdn.com/w40/cd.png",
  "Austria": "https://flagcdn.com/w40/at.png",
  "Jordan": "https://flagcdn.com/w40/jo.png",
  // Grupo H
  "Netherlands": "https://flagcdn.com/w40/nl.png",
  "South Korea": "https://flagcdn.com/w40/kr.png",
  "Cameroon": "https://flagcdn.com/w40/cm.png",
  "Honduras": "https://flagcdn.com/w40/hn.png",
  // Grupo I
  "England": "https://flagcdn.com/w40/gb-eng.png",
  "Serbia": "https://flagcdn.com/w40/rs.png",
  "Panama": "https://flagcdn.com/w40/pa.png",
  // Grupo J
  "USA": "https://flagcdn.com/w40/us.png",
  "Nigeria": "https://flagcdn.com/w40/ng.png",
  "Ghana": "https://flagcdn.com/w40/gh.png",
  "Ukraine": "https://flagcdn.com/w40/ua.png",
  // Grupo K
  "Canada": "https://flagcdn.com/w40/ca.png",
  "Qatar": "https://flagcdn.com/w40/qa.png",
  "Venezuela": "https://flagcdn.com/w40/ve.png",
  "Slovakia": "https://flagcdn.com/w40/sk.png",
  // Grupo L
  "Switzerland": "https://flagcdn.com/w40/ch.png",
  "Bosnia & Herzegovina": "https://flagcdn.com/w40/ba.png",
  "Ivory Coast": "https://flagcdn.com/w40/ci.png",
  "Côte d'Ivoire": "https://flagcdn.com/w40/ci.png",
  "Cote d'Ivoire": "https://flagcdn.com/w40/ci.png",
  "Iraq": "https://flagcdn.com/w40/iq.png",
};

// Componente Flag
const Flag = ({ country, size = 24 }) => {
  const flagUrl = FLAG_IMAGES[country];
  
  if (!flagUrl) {
    return <span style={{ fontSize: size * 0.8 }}>🏆</span>;
  }

  return (
    <img 
      src={flagUrl}
      alt={`${country} flag`}
      style={{
        width: size,
        height: size * 0.75,
        objectFit: 'cover',
        borderRadius: 2,
        display: 'block',
      }}
      loading="lazy"
      onError={(e) => {
        e.target.style.display = 'none';
        const parent = e.target.parentElement;
        if (parent) {
          parent.innerHTML = `<span style="font-size:${size * 0.8}px">🏆</span>`;
        }
      }}
    />
  );
};

// ── Função para verificar se é um jogo da Copa ──────────────────────
const isWorldCupGame = (home, away) => {
  // Verifica se AMBOS os times estão na lista da Copa
  return WORLD_CUP_TEAMS.has(home) && WORLD_CUP_TEAMS.has(away);
};

const fmtHora = (ts) => {
  if (!ts) return "—";
  return new Date(ts).toLocaleTimeString("pt-BR", {
    hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo",
  });
};

const FALLBACK = [
  {
    id: "f1",
    home: "Brasil",
    away: "Argentina",
    hG: null,
    aG: null,
    ts: new Date(Date.now() + 3600000).toISOString(), // 1 hora no futuro
    status: "scheduled",
    grupo: "Grupo A",
    min: null
  }
];

export default function WidgetCopa() {
  const [jogos, setJogos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erroApi, setErroApi] = useState(false);
  const [pagina, setPagina] = useState(0);
  const [minimizado, setMinimizado] = useState(false);

  const POR_PAG = 2;

  const buscar = useCallback(async () => {
    try {
      // Usando a rota que já existe no seu backend
      const res = await fetch('/api/worldcup/squads');
      
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const data = await res.json();
      console.log('📊 Dados da API:', data);

      // Seu backend retorna { results: [...] }
      const lista = data.results ?? data.events ?? data.matches ?? [];

      if (!Array.isArray(lista) || lista.length === 0) {
        throw new Error("Sem jogos da Copa");
      }

      // Filtra APENAS os jogos da Copa do Mundo
      const jogosCopa = lista
        .filter((g) => {
          const home = g.home_team ?? g.home ?? "?";
          const away = g.away_team ?? g.away ?? "?";
          return isWorldCupGame(home, away);
        })
        .map((g) => ({
          id: g.id || g.match_id || `game_${Math.random()}`,
          home: g.home_team ?? g.home ?? "?",
          away: g.away_team ?? g.away ?? "?",
          hG: g.home_score ?? g.homeScore ?? null,
          aG: g.away_score ?? g.awayScore ?? null,
          ts: g.event_date ?? g.start_time ?? g.date ?? null,
          status: g.status === 'inprogress' || g.status === 'live' 
            ? 'live' 
            : g.status === 'finished' || g.status === 'final' 
              ? 'final' 
              : 'scheduled',
          grupo: g.group_name || g.group || g.league_name || "Copa 2026",
          min: g.current_minute ?? g.minute ?? null,
        }));

      console.log(`✅ ${jogosCopa.length} jogos da Copa filtrados`);
      
      if (jogosCopa.length === 0) {
        // Se não encontrou jogos da Copa, mostra mensagem
        setJogos([]);
        setErroApi(false);
      } else {
        setJogos(jogosCopa);
        setErroApi(false);
      }
      
    } catch (e) {
      console.warn("⚠️ WidgetCopa:", e.message);
      setErroApi(true);
      setJogos(FALLBACK);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    buscar();
    const id = setInterval(buscar, 60000); // atualiza a cada 1 minuto
    return () => clearInterval(id);
  }, [buscar]);

  const totalPag = Math.ceil(jogos.length / POR_PAG);
  const paginados = jogos.slice(pagina * POR_PAG, (pagina + 1) * POR_PAG);
  const temLive = jogos.some((j) => j.status === "live");

  return (
    <>
      <style>{`
        @keyframes wc-blink { 0%,100%{opacity:1} 50%{opacity:.15} }
        .wc-root { box-sizing: border-box; }
        .wc-root *, .wc-root *::before, .wc-root *::after { box-sizing: inherit; }
        .wc-nav-btn {
          background: none; border: none; cursor: pointer; padding: 3px 5px;
          color: #60a5fa; font-size: 11px; display: flex; align-items: center;
          border-radius: 4px; transition: color .15s, background .15s;
        }
        .wc-nav-btn:disabled { color: #1f2937; cursor: default; }
        .wc-nav-btn:not(:disabled):hover { color: #fff; background: rgba(255,255,255,.08); }
        .no-games {
          padding: 20px 10px;
          text-align: center;
          color: #9ca3af;
          font-size: 11px;
        }
        .no-games .icon {
          display: block;
          margin-bottom: 6px;
          font-size: 24px;
        }
        .no-games .sub {
          font-size: 9px;
          color: #6b7280;
          margin-top: 4px;
        }
      `}</style>

      <div
        className="wc-root"
        style={{
          position: "fixed",
          bottom: 24,
          left: 24,
          width: 215,
          zIndex: 9500,
          fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: 12,
          color: "#e5e7eb",
          background: "linear-gradient(160deg,#071020 0%,#0d1f3c 65%,#071020 100%)",
          borderRadius: 14,
          border: temLive
            ? "1px solid rgba(234,179,8,.55)"
            : "1px solid rgba(255,255,255,.1)",
          boxShadow: temLive
            ? "0 0 20px rgba(234,179,8,.2), 0 8px 32px rgba(0,0,0,.75)"
            : "0 8px 32px rgba(0,0,0,.7)",
          overflow: "hidden",
          userSelect: "none",
          transition: "border-color .3s, box-shadow .3s",
        }}
      >
        <div style={{
          background: "linear-gradient(90deg,#0a2a6e 0%,#183880 100%)",
          padding: "8px 10px",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>🏆</span>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: "#fff", letterSpacing: .5, lineHeight: 1.2 }}>
              COPA DO MUNDO 2026
            </div>
            <div style={{ fontSize: 7.5, color: "#93c5fd", letterSpacing: .8, marginTop: 2 }}>
              {temLive ? "● JOGANDO AGORA" : "USA · MEX · CAN"}
            </div>
          </div>

          {temLive && (
            <span style={{
              background: "#dc2626", color: "#fff",
              fontSize: 7, fontWeight: 800, letterSpacing: .5,
              padding: "2px 6px", borderRadius: 20, flexShrink: 0,
              animation: "wc-blink 1s infinite",
            }}>
              LIVE
            </span>
          )}

          {erroApi && (
            <span style={{ fontSize: 9, color: "#fca5a5", flexShrink: 0 }} title="Usando dados locais — verifique o proxy">
              ⚠
            </span>
          )}

          <button
            onClick={() => setMinimizado((m) => !m)}
            aria-label={minimizado ? "Expandir widget" : "Minimizar widget"}
            style={{
              background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.15)",
              color: "rgba(255,255,255,.8)", width: 20, height: 20,
              borderRadius: "50%", cursor: "pointer",
              fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, transition: "background .15s",
            }}
          >
            {minimizado ? "▲" : "▼"}
          </button>
        </div>

        {!minimizado && (
          <>
            {carregando ? (
              <div style={{ padding: "16px 10px", textAlign: "center", color: "#4b5563", fontSize: 11 }}>
                Buscando partidas...
              </div>
            ) : paginados.length === 0 ? (
              <div className="no-games">
                <span className="icon">⚽</span>
                Nenhum jogo da Copa no momento
                <div className="sub">
                  Acompanhe os jogos em breve!
                </div>
              </div>
            ) : (
              paginados.map((j, i) => {
                const isLive = j.status === "live";
                const isFinal = j.status === "final";
                const temPlacar = (isLive || isFinal) && j.hG !== null && j.hG !== undefined;

                return (
                  <div key={j.id} style={{
                    padding: "8px 10px",
                    borderBottom: i < paginados.length - 1
                      ? "1px solid rgba(255,255,255,.05)"
                      : "none",
                    background: isLive
                      ? "rgba(234,179,8,.06)"
                      : "transparent",
                    transition: "background .3s",
                  }}>
                    <div style={{
                      display: "flex", justifyContent: "space-between",
                      alignItems: "center", marginBottom: 6,
                    }}>
                      <span style={{
                        fontSize: 8, color: "#9ca3af",
                        background: "rgba(255,255,255,.06)",
                        padding: "1px 5px", borderRadius: 3,
                        maxWidth: "55%", overflow: "hidden",
                        textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {j.grupo || "Copa 2026"}
                      </span>

                      <span style={{
                        fontSize: 8.5,
                        fontWeight: isLive ? 700 : 400,
                        color: isLive ? "#f59e0b" : isFinal ? "#6b7280" : "#60a5fa",
                      }}>
                        {isLive
                          ? (j.min ? `● ${j.min}'` : "● AO VIVO")
                          : isFinal
                            ? "ENCERRADO"
                            : fmtHora(j.ts)}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <div style={{
                        flex: 1, display: "flex", flexDirection: "column",
                        alignItems: "center", gap: 3, minWidth: 0,
                      }}>
                        <Flag country={j.home} size={28} />
                        <span style={{
                          fontSize: 9, color: "#d1d5db", fontWeight: 600,
                          textAlign: "center", width: "100%",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          {j.home}
                        </span>
                      </div>

                      <div style={{ flexShrink: 0, textAlign: "center", minWidth: 40 }}>
                        {temPlacar ? (
                          <span style={{
                            fontSize: 17, fontWeight: 800, fontFamily: "monospace",
                            letterSpacing: 2,
                            color: isLive ? "#f59e0b" : "#f9fafb",
                          }}>
                            {j.hG}–{j.aG}
                          </span>
                        ) : (
                          <span style={{
                            fontSize: 9, color: "rgba(255,255,255,.2)",
                            border: "1px solid rgba(255,255,255,.08)",
                            borderRadius: 4, padding: "2px 6px",
                          }}>
                            vs
                          </span>
                        )}
                      </div>

                      <div style={{
                        flex: 1, display: "flex", flexDirection: "column",
                        alignItems: "center", gap: 3, minWidth: 0,
                      }}>
                        <Flag country={j.away} size={28} />
                        <span style={{
                          fontSize: 9, color: "#d1d5db", fontWeight: 600,
                          textAlign: "center", width: "100%",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          {j.away}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {totalPag > 1 && (
              <div style={{
                display: "flex", alignItems: "center",
                justifyContent: "center", gap: 4,
                padding: "5px 10px",
                borderTop: "1px solid rgba(255,255,255,.05)",
                background: "rgba(0,0,0,.2)",
              }}>
                <button
                  className="wc-nav-btn"
                  onClick={() => setPagina((p) => Math.max(0, p - 1))}
                  disabled={pagina === 0}
                >
                  ◀
                </button>

                <span style={{ fontSize: 8.5, color: "#6b7280", padding: "0 4px" }}>
                  {pagina + 1} / {totalPag}
                </span>

                <button
                  className="wc-nav-btn"
                  onClick={() => setPagina((p) => Math.min(totalPag - 1, p + 1))}
                  disabled={pagina === totalPag - 1}
                >
                  ▶
                </button>
              </div>
            )}

            <div style={{
              padding: "4px 10px",
              background: "rgba(0,0,0,.35)",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <span style={{ fontSize: 7.5, color: "#374151" }}>
                {jogos.length} jogos da Copa
              </span>
              <span style={{ fontSize: 7.5, color: "#2563eb" }}>
                365scores
              </span>
            </div>
          </>
        )}
      </div>
    </>
  );
}