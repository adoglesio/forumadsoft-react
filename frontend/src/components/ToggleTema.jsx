import { useTheme } from "../context/ThemeContext";
import { IoMdSunny } from "react-icons/io";
import { IoMoon } from "react-icons/io5";

// Injeta o CSS uma única vez no head
if (!document.getElementById("toggle-tema-style")) {
  const s = document.createElement("style");
  s.id = "toggle-tema-style";
  s.textContent = `
    .toggle-track {
      width: 56px; height: 30px; border-radius: 30px;
      cursor: pointer; position: relative; padding: 0;
      outline: none; transition: background 0.3s, border-color 0.3s;
      flex-shrink: 0; border: 2px solid #d1d5db;
      background: #e5e7eb;
    }
    .toggle-track.escuro {
      border-color: #f85149;
      background: #1c1c1e;
    }
    .toggle-knob {
      position: absolute; top: 2px; left: 2px;
      width: 22px; height: 22px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 11px;
      transition: transform 0.25s cubic-bezier(.4,0,.2,1), background 0.3s, box-shadow 0.3s;
      background: linear-gradient(135deg, #ffffff, #f3f4f6);
      box-shadow: 0 2px 8px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.9);
    }
    .toggle-track.escuro .toggle-knob {
      transform: translateX(26px);
      background: linear-gradient(135deg, #1c1c2e, #2d2d44);
      box-shadow: 0 2px 8px rgba(248,81,73,0.4), inset 0 1px 0 rgba(255,255,255,0.1);
    }
    .toggle-icon-sol {
      position: absolute; left: 5px; top: 50%; transform: translateY(-50%);
      font-size: 12px; transition: opacity 0.2s; user-select: none; pointer-events: none;
    }
    .toggle-icon-lua {
      position: absolute; right: 5px; top: 50%; transform: translateY(-50%);
      font-size: 12px; transition: opacity 0.2s; user-select: none; pointer-events: none;
    }
  `;
  document.head.appendChild(s);
}

export default function ToggleTema() {
  const { temaNome, setTemaNome } = useTheme();
  const isEscuro = temaNome === "escuro";

  return (
    <button
      className={`toggle-track ${isEscuro ? "escuro" : ""}`}
      onClick={() => setTemaNome(isEscuro ? "claro" : "escuro")}
      title={isEscuro ? "Mudar para Claro" : "Mudar para Escuro"}
    >
      
      <span className="toggle-knob">{isEscuro ? <IoMoon style={{ color: "#ffffff" }} /> : <IoMdSunny />}</span>
    </button>
  );
}