import { createContext, useContext, useState, useEffect } from "react";

const temas = {
  claro: {
    nome: "Claro",
    cor: "#F8FAFE",
    pageBg: "#F0F4F8",
    cardBg: "#ffffff",
    headerBg: "#ffffff",
    headerBorder: "#E2E8F0",
    inputBg: "#ffffff",
    inputBorder: "#E2E8F0",
    textoPrimario: "#1E2F3E",
    textoSecundario: "#5C6F87",
    textoMutado: "#A0AEC0",
    statBg1: "#EFF7FF", statCor1: "#0A5C8E",
    statBg2: "#F0FDF4", statCor2: "#2C7A4D",
    statBg3: "#FFFBEB", statCor3: "#C26B2E",
    statBg4: "#F0FDF4", statCor4: "#22c55e",
    asideBg: "#ffffff",
    asideBorder: "#E9EFF5",
    sidebarBg: "#ffffff",
    sidebarHover: "#F0F7FF",
    cardSombra: "0 2px 12px rgba(0,0,0,0.06)",
  },
  escuro: {
    nome: "Escuro",
    cor: "#0f1923",
    pageBg: "#0d1117",
    cardBg: "#161b22",
    headerBg: "#161b22",
    headerBorder: "#21262d",
    inputBg: "#0d1117",
    inputBorder: "#30363d",
    textoPrimario: "#e6edf3",
    textoSecundario: "#8b949e",
    textoMutado: "#484f58",
    statBg1: "#0d2035", statCor1: "#58a6ff",
    statBg2: "#0d2518", statCor2: "#3fb950",
    statBg3: "#271700", statCor3: "#d29922",
    statBg4: "#0d2518", statCor4: "#3fb950",
    asideBg: "#161b22",
    asideBorder: "#21262d",
    sidebarBg: "#161b22",
    sidebarHover: "#1c2128",
    cardSombra: "0 2px 12px rgba(0,0,0,0.3)",
  },
};

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [temaNome, setTemaNome] = useState(
    () => localStorage.getItem("adsoft_tema") || "claro"
  );
  const tema = temas[temaNome] || temas.claro;
  useEffect(() => { localStorage.setItem("adsoft_tema", temaNome); }, [temaNome]);

  return (
    <ThemeContext.Provider value={{ tema, temaNome, setTemaNome, temas }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() { return useContext(ThemeContext); }