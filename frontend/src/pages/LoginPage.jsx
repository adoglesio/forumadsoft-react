import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import icone from '../assets/logotipo.png';
import { IoAlertCircle } from "react-icons/io5";

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
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      minHeight: "100vh", padding: 20,
      background: "linear-gradient(160deg, #0A1622 0%, #0d2a42 46%, #0A5C8E 100%)",
    }}>
      <div style={{
        background: "#fff", padding: "36px 32px", borderRadius: 20, width: "100%", maxWidth: 400,
        boxShadow: "0 24px 64px rgba(4,16,28,0.35)", animation: "df-pop-in 0.35s ease",
      }}>
        <div style={{ textAlign: "center", marginBottom: 26 }}>
          <img src={icone} alt="Dodô Forum" width={84} height={84} style={{ objectFit: "contain", marginBottom: 6 }} />
          <h1 style={{ fontFamily: "var(--font-display)", color: "#0A5C8E", margin: "6px 0 4px", fontSize: 26, fontWeight: 800, letterSpacing: -0.5 }}>Dodô Forum</h1>
          <p style={{ color: "#5C6F87", margin: 0, fontSize: 14 }}>Entre com seu e-mail @adsoft.com.br</p>
        </div>

        <div className="field">
          <label className="field-label" htmlFor="login-email">E-mail</label>
          <input
            id="login-email"
            type="email"
            placeholder="voce@adsoft.com.br"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            autoFocus
          />
        </div>

        <div className="field">
          <label className="field-label" htmlFor="login-senha">Senha</label>
          <input
            id="login-senha"
            type="password"
            placeholder="Sua senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            className="input"
          />
        </div>

        {erro && (
          <p className="form-message form-message-error" style={{ marginBottom: 14 }}>
            <IoAlertCircle size={15} /> {erro}
          </p>
        )}

        <button onClick={handleLogin} disabled={loading} className="btn btn-primary btn-block" style={{ padding: 12, fontSize: 15, marginTop: 4 }}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </div>
    </div>
  );
}
