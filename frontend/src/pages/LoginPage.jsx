import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import icone from '../assets/logotipo.png';

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleLogin() {
    if (!email || !senha) { setErro("Preencha email e senha."); return; }
    if (!email.endsWith("@adsoft.com.br")) { setErro("Use um e-mail @adsoft.com.br"); return; }
    setLoading(true); setErro("");
    try {
      await login(email, senha);
      navigate("/");
    } catch (e) {
      setErro(e.response?.data?.error || "Erro ao fazer login.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#F8FAFE" }}>
      <div style={{ background: "white", padding: 32, borderRadius: 24, width: 400, boxShadow: "0 10px 40px rgba(0,0,0,0.08)" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 100 }}>
            <img src={icone} alt="Dodoforum" width={150} height={150} style={{ objectFit: "contain" }} />
          </div>
          <h1 style={{ fontFamily: "Orbitron,sans-serif", color: "#094569", margin: "8px 0 4px" }}>fórum</h1>
          <p style={{ color: "#5C6F87", margin: 0 }}>Use seu e-mail @adsoft.com.br</p>
        </div>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
        <input type="password" placeholder="Senha" value={senha} onChange={(e) => setSenha(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleLogin()} style={{ ...inputStyle, marginBottom: 20 }} />
        {erro && <p style={{ color: "#DC2626", marginBottom: 12, fontSize: 14 }}>? {erro}</p>}
        <button onClick={handleLogin} disabled={loading} style={{ width: "100%", padding: 12, background: "#0A5C8E", color: "white", border: "none", borderRadius: 40, fontWeight: "bold", fontSize: 16, cursor: "pointer" }}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </div>
    </div>
  );
}

const inputStyle = { width: "100%", padding: 12, marginBottom: 12, border: "1px solid #E2E8F0", borderRadius: 12, fontSize: 15, outline: "none", boxSizing: "border-box" };
