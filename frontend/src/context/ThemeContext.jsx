import { createContext, useContext, useState, useEffect } from "react";

// ─────────────────────────────────────────────────────────────────────────
// Sistema de tokens do Dodô Forum.
// Cada tema expõe um conjunto de cores semânticas. Os mesmos valores são
// espelhados como custom properties CSS (ver useEffect abaixo) para que
// estilos definidos em index.css (hover, media queries, transições) também
// acompanhem o tema ativo sem depender de inline-style.
// ─────────────────────────────────────────────────────────────────────────

const temas = {
  claro: {
    nome: "Claro",
    cor: "#F8FAFE",

    pageBg: "#F3F6FA",
    cardBg: "#FFFFFF",
    surfaceAlt: "#EDF2F8",
    headerBg: "#FFFFFF",
    headerBorder: "#E4E9F1",
    inputBg: "#FFFFFF",
    inputBorder: "#D9E1EC",

    textoPrimario: "#101828",
    textoSecundario: "#4B5768",
    textoMutado: "#98A2B3",

    primario: "#0A5C8E",
    primarioHover: "#084A72",
    primarioSoft: "#E8F2FA",

    statBg1: "#E8F2FA", statCor1: "#0A5C8E",
    statBg2: "#E9F9EF", statCor2: "#1F8A4C",
    statBg3: "#FDF1E4", statCor3: "#B5651D",
    statBg4: "#E9F9EF", statCor4: "#1F8A4C",

    sucessoBg: "#E9F9EF", sucessoCor: "#1F8A4C", sucessoBorda: "#BEEACB",
    alertaBg: "#FDF1E4", alertaCor: "#B5651D", alertaBorda: "#F4D4AA",
    erroBg: "#FCEBEC", erroCor: "#C2281F", erroBorda: "#F3C3C1",
    infoBg: "#E6F5F8", infoCor: "#0B7285",

    asideBg: "#FFFFFF",
    asideBorder: "#E7ECF3",
    sidebarBg: "#FFFFFF",
    sidebarHover: "#F0F6FC",

    cardSombra: "0 1px 2px rgba(16,24,40,0.04), 0 4px 16px rgba(16,24,40,0.06)",
    cardSombraHover: "0 4px 10px rgba(16,24,40,0.06), 0 12px 28px rgba(16,24,40,0.10)",
    popSombra: "0 20px 56px rgba(16,24,40,0.24)",
  },
  escuro: {
    nome: "Escuro",
    cor: "#0f1923",

    pageBg: "#0A0F16",
    cardBg: "#111820",
    surfaceAlt: "#0D141C",
    headerBg: "#111820",
    headerBorder: "#22303F",
    inputBg: "#0C131B",
    inputBorder: "#26364A",

    textoPrimario: "#E7EDF3",
    textoSecundario: "#93A2B5",
    textoMutado: "#5A6B80",

    primario: "#4FA8DE",
    primarioHover: "#6DBBEA",
    primarioSoft: "rgba(79,168,222,0.14)",

    statBg1: "rgba(79,168,222,0.12)",  statCor1: "#58B2E8",
    statBg2: "rgba(63,185,120,0.12)",  statCor2: "#4ACB86",
    statBg3: "rgba(217,155,74,0.14)",  statCor3: "#E0A75E",
    statBg4: "rgba(63,185,120,0.12)",  statCor4: "#4ACB86",

    sucessoBg: "rgba(63,185,120,0.12)", sucessoCor: "#4ACB86", sucessoBorda: "rgba(63,185,120,0.3)",
    alertaBg: "rgba(217,155,74,0.14)",  alertaCor: "#E0A75E", alertaBorda: "rgba(217,155,74,0.32)",
    erroBg: "rgba(240,90,90,0.13)",     erroCor: "#F17272",   erroBorda: "rgba(240,90,90,0.32)",
    infoBg: "rgba(69,180,200,0.14)",    infoCor: "#66C7DD",

    asideBg: "#111820",
    asideBorder: "#22303F",
    sidebarBg: "#111820",
    sidebarHover: "#17212B",

    cardSombra: "0 1px 2px rgba(0,0,0,0.3), 0 4px 16px rgba(0,0,0,0.28)",
    cardSombraHover: "0 4px 10px rgba(0,0,0,0.3), 0 14px 32px rgba(0,0,0,0.36)",
    popSombra: "0 24px 64px rgba(0,0,0,0.55)",
  },
};

const ThemeContext = createContext();

// Mapeia chaves do objeto de tema para nomes de custom properties CSS.
const CSS_VAR_MAP = {
  pageBg: "--bg", cardBg: "--surface", surfaceAlt: "--surface-alt",
  headerBg: "--header-bg", headerBorder: "--border", inputBg: "--input-bg", inputBorder: "--input-border",
  textoPrimario: "--text", textoSecundario: "--text-secondary", textoMutado: "--text-muted",
  primario: "--primary", primarioHover: "--primary-hover", primarioSoft: "--primary-soft",
  sucessoBg: "--success-bg", sucessoCor: "--success", sucessoBorda: "--success-border",
  alertaBg: "--warning-bg", alertaCor: "--warning", alertaBorda: "--warning-border",
  erroBg: "--danger-bg", erroCor: "--danger", erroBorda: "--danger-border",
  infoBg: "--info-bg", infoCor: "--info",
  asideBorder: "--aside-border", sidebarHover: "--surface-hover",
  cardSombra: "--shadow-card", cardSombraHover: "--shadow-card-hover", popSombra: "--shadow-pop",
};

export function ThemeProvider({ children }) {
  const [temaNome, setTemaNome] = useState(
    () => localStorage.getItem("adsoft_tema") || "claro"
  );
  const tema = temas[temaNome] || temas.claro;

  useEffect(() => { localStorage.setItem("adsoft_tema", temaNome); }, [temaNome]);

  useEffect(() => {
    const root = document.documentElement;
    Object.entries(CSS_VAR_MAP).forEach(([chave, varName]) => {
      root.style.setProperty(varName, tema[chave]);
    });
    root.setAttribute("data-tema", temaNome);
  }, [tema, temaNome]);

  return (
    <ThemeContext.Provider value={{ tema, temaNome, setTemaNome, temas }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() { return useContext(ThemeContext); }
