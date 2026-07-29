import { useState, useRef, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";

const CATEGORIAS = [
  { label: "😊", emojis: ["😀","😂","😅","😆","🤣","😊","😇","🙂","😉","😍","🥰","😘","😎","🤩","😏","😒","😔","😢","😭","😤","😠","🤬","😱","😨","🤔","🤗","🤭","🤫","🙄","😴"] },
  { label: "👍", emojis: ["👍","👎","👏","🙌","🤝","🤜","🤛","✊","👊","🤚","✋","🖐","👋","🤙","💪","🦾","🙏","🫶","❤️","🧡","💛","💚","💙","💜","🖤","🤍","💔","❤️‍🔥","⭐","🔥"] },
  { label: "🎉", emojis: ["🎉","🎊","🎈","🎁","🏆","🥇","🎯","✅","❌","⚠️","🔴","🟡","🟢","🔵","💡","🔍","🛠","💻","🐛","🚀","⚡","🌟","💯","🤦","🤷","👀","💬","📝","🔑","🗑️"] },
];

export default function PainelEmoji({ onSelecionar }) {
  const { tema } = useTheme();
  const [aberto, setAberto] = useState(false);
  const [catAtiva, setCatAtiva] = useState(0);
  const ref = useRef();

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setAberto(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function selecionar(emoji) {
    onSelecionar(emoji);
    setAberto(false);
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setAberto(p => !p)}
        style={{
          width: 34, height: 34, borderRadius: 8,
          border: `1px solid ${tema.inputBorder}`,
          background: aberto ? tema.statBg1 : tema.cardBg,
          cursor: "pointer", fontSize: 18,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}
        title="Inserir emoji"
      >
        😊
      </button>

      {aberto && (
        <div style={{
          position: "fixed",
          bottom: 90, right: 24,
          background: tema.cardBg, border: `1px solid ${tema.inputBorder}`,
          borderRadius: 16, zIndex: 99999,
          boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
          width: 280,
        }}>
          {/* Abas de categorias */}
          <div style={{ display: "flex", borderBottom: `1px solid ${tema.inputBorder}`, padding: "6px 8px 0" }}>
            {CATEGORIAS.map((cat, i) => (
              <button
                key={i}
                onClick={() => setCatAtiva(i)}
                style={{
                  padding: "6px 10px", border: "none", cursor: "pointer",
                  fontSize: 18, borderRadius: "8px 8px 0 0",
                  background: catAtiva === i ? tema.statBg1 : "transparent",
                  borderBottom: catAtiva === i ? `2px solid #0A5C8E` : "2px solid transparent",
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Grid de emojis */}
          <div style={{ padding: 8, display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 2 }}>
            {CATEGORIAS[catAtiva].emojis.map(emoji => (
              <button
                key={emoji}
                onClick={() => selecionar(emoji)}
                style={{
                  width: 30, height: 30, border: "none",
                  background: "transparent", cursor: "pointer",
                  fontSize: 18, borderRadius: 6,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "background 0.1s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = tema.statBg1}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
