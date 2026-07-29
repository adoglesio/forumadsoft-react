import { useState, useEffect } from "react";
import { buscarReacoes, reagir } from "../services/api";
import { useTheme } from "../context/ThemeContext";

const REACOES = [
  { tipo: "👍", label: "Curtir" },
  { tipo: "❤️", label: "Amei" },
  { tipo: "🔥", label: "Incrível" },
  { tipo: "😮", label: "Surpreso" },
  { tipo: "😂", label: "Engraçado" },
  { tipo: "😢", label: "Triste" },
];

export default function Reacoes({ erroId, user }) {
  const { tema } = useTheme();
  const [dados, setDados] = useState({ reacoes: [], minhas: [] });
  const [mostrarPainel, setMostrarPainel] = useState(false);

  useEffect(() => {
    if (erroId && user?.email) {
      buscarReacoes(erroId, user.email).then(setDados).catch(() => {});
    }
  }, [erroId, user]);

  async function handleReagir(e, tipo) {
    e.stopPropagation();
    try {
      const novo = await reagir(erroId, user.email, tipo);
      setDados(novo);
    } catch {}
    setMostrarPainel(false);
  }

  function totalTipo(tipo) {
    return dados.reacoes.find(r => r.tipo === tipo)?.total || 0;
  }

  const reacoesMostradas = REACOES.filter(r => totalTipo(r.tipo) > 0 || dados.minhas.includes(r.tipo));
  const totalGeral = dados.reacoes.reduce((acc, r) => acc + r.total, 0);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", position: "relative" }} onClick={e => e.stopPropagation()}>

      {/* Reações já feitas */}
      {reacoesMostradas.map(r => {
        const ativa = dados.minhas.includes(r.tipo);
        const total = totalTipo(r.tipo);
        return (
          <button
            key={r.tipo}
            onClick={e => handleReagir(e, r.tipo)}
            title={r.label}
            style={{
              display: "flex", alignItems: "center", gap: 4,
              padding: "4px 10px", borderRadius: 20,
              border: ativa ? "1.5px solid #0A5C8E" : `1px solid ${tema.inputBorder}`,
              background: ativa ? "#EFF7FF" : tema.cardBg,
              cursor: "pointer", fontSize: 14,
              color: ativa ? "#0A5C8E" : tema.textoSecundario,
              fontWeight: ativa ? 600 : 400,
              transition: "all 0.15s",
            }}
          >
            {r.tipo} {total > 0 && <span style={{ fontSize: 12 }}>{total}</span>}
          </button>
        );
      })}

      {/* Botão + para abrir painel */}
      <div style={{ position: "relative" }}>
        <button
          onClick={e => { e.stopPropagation(); setMostrarPainel(p => !p); }}
          style={{
            width: 30, height: 30, borderRadius: "50%",
            border: `1px solid ${tema.inputBorder}`,
            background: tema.cardBg, cursor: "pointer",
            fontSize: 16, color: tema.textoSecundario,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          {mostrarPainel ? "×" : "😊"}
        </button>

        {/* Painel de reações */}
        {mostrarPainel && (
          <div style={{
            position: "absolute", bottom: 36, left: 0,
            background: tema.cardBg, border: `1px solid ${tema.inputBorder}`,
            borderRadius: 16, padding: "8px 10px",
            display: "flex", gap: 4, zIndex: 100,
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          }}>
            {REACOES.map(r => (
              <button
                key={r.tipo}
                onClick={e => handleReagir(e, r.tipo)}
                title={r.label}
                style={{
                  width: 38, height: 38, borderRadius: "50%",
                  border: dados.minhas.includes(r.tipo) ? "2px solid #0A5C8E" : "2px solid transparent",
                  background: dados.minhas.includes(r.tipo) ? "#EFF7FF" : "transparent",
                  cursor: "pointer", fontSize: 20,
                  transition: "transform 0.1s",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
                onMouseEnter={e => e.currentTarget.style.transform = "scale(1.3)"}
                onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
              >
                {r.tipo}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Total geral */}
      {totalGeral > 0 && (
        <span style={{ fontSize: 12, color: tema.textoMutado }}>
          {totalGeral} reação{totalGeral !== 1 ? "ões" : ""}
        </span>
      )}
    </div>
  );
}
