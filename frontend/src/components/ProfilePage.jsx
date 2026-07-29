import { useState, useRef } from "react";
import { IoPencil, IoKey, IoLogOut, IoSave, IoCamera } from "react-icons/io5";
import { useAuth } from "../context/AuthContext";
import api, { atualizarPerfil, alterarSenha } from "../services/api";

// Imagem de fundo dark (padrão geométrico SVG inline como base64)
const BG_IMAGE = `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`;

export default function ProfilePage({ onVoltar }) {
  const { user, setUser, logout } = useAuth();
  const [bio, setBio] = useState(user?.bio || "");
  const [perfilMsg, setPerfilMsg] = useState("");
  const [senhaMsg, setSenhaMsg] = useState("");
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const fileRef = useRef();

  async function salvarPerfil() {
    try {
      await atualizarPerfil({ email: user.email, bio });
      const novoUser = { ...user, bio };
      sessionStorage.setItem("adsoft_current_user", JSON.stringify(novoUser));
      setUser(novoUser);
      setPerfilMsg("Perfil salvo!");
    } catch { setPerfilMsg("Erro ao salvar."); }
  }

  async function trocarSenha() {
    if (novaSenha !== confirmar) { setSenhaMsg("❌ Senhas não coincidem."); return; }
    if (novaSenha.length < 4) { setSenhaMsg("❌ Mínimo 4 caracteres."); return; }
    try {
      await alterarSenha({ email: user.email, senhaAtual, novaSenha });
      setSenhaMsg("Senha alterada!");
      setSenhaAtual(""); setNovaSenha(""); setConfirmar("");
    } catch (e) { setSenhaMsg("❌ " + (e.response?.data?.error || "Erro.")); }
  }

  async function handleAvatar(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target.result;
      await atualizarPerfil({ email: user.email, avatar: base64 });
      const novoUser = { ...user, avatar: base64 };
      sessionStorage.setItem("adsoft_current_user", JSON.stringify(novoUser));
      setUser(novoUser);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "24px 16px" }}>
      <button onClick={onVoltar} style={btnOutline}>← Voltar</button>

      <div style={cardStyle}>
        {/* ── Faixa de fundo dark no topo do card ── */}
        <div style={cardBannerStyle} />

        {/* ── Avatar centralizado sobre a faixa ── */}
        <div style={{ textAlign: "center", position: "relative", marginTop: -48, marginBottom: 16 }}>
          {user?.avatar
            ? <img src={user.avatar} alt="" style={avatarStyle} />
            : <div style={{ ...avatarStyle, background: "#0A5C8E", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 32 }}>
                {user?.nome?.charAt(0)?.toUpperCase()}
              </div>
          }
          <button onClick={() => fileRef.current.click()} style={btnAlterar}>
            <IoCamera size={13} style={{marginRight:4}} />Alterar foto
          </button>
          <input type="file" ref={fileRef} accept="image/*" style={{ display: "none" }} onChange={handleAvatar} />
          <h3 style={{ margin: "10px 0 4px", color: "#1E2F3E", fontSize: 20, fontWeight: 700 }}>{user?.nome}</h3>
          <p style={{ color: "#5C6F87", margin: 0, fontSize: 14 }}>{user?.email}</p>
          {user?.isAdmin && (
            <span style={{ background: "gold", padding: "3px 12px", borderRadius: 20, fontSize: 12, color: "#333", marginTop: 8, display: "inline-block", fontWeight: 600 }}>
              Administrador
            </span>
          )}
        </div>

        {/* ── Corpo do card ── */}
        <div style={{ padding: "0 4px" }}>
          <label style={labelStyle}>Bio</label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
          <button onClick={salvarPerfil} style={btnPrimary}><IoSave size={14} style={{marginRight:4}} />Salvar Perfil</button>
          {perfilMsg && <p style={{ fontSize: 13, marginTop: 8, color: perfilMsg.startsWith("✅") ? "#16A34A" : "#DC2626" }}>{perfilMsg}</p>}

          <hr style={{ margin: "24px 0", borderColor: "#E9EFF5" }} />

          <details style={{ border: "1px solid #E2E8F0", borderRadius: 12, padding: 16 }}>
            <summary style={{ cursor: "pointer", fontWeight: 600, color: "#0A5C8E" }}>► Trocar Senha</summary>
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
              <input type="password" placeholder="Senha atual" value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} style={inputStyle} />
              <input type="password" placeholder="Nova senha" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} style={inputStyle} />
              <input type="password" placeholder="Confirmar nova senha" value={confirmar} onChange={(e) => setConfirmar(e.target.value)} style={inputStyle} />
              <button onClick={trocarSenha} style={btnPrimary}>Trocar Senha</button>
              {senhaMsg && <p style={{ fontSize: 13, color: senhaMsg.startsWith("✅") ? "#16A34A" : "#DC2626" }}>{senhaMsg}</p>}
            </div>
          </details>

          <button
            onClick={() => { api.post("/usuarios/logout", { email: user.email }).catch(() => {}); logout(); }}
            style={{ ...btnOutline, width: "100%", marginTop: 20, color: "#DC2626", borderColor: "#DC2626" }}
          >
            Sair da conta
          </button>
        </div>
      </div>
    </div>
  );
}

const cardStyle = {
  background: "white",
  borderRadius: 20,
  overflow: "hidden",
  boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
  border: "1px solid #E9EFF5",
  marginTop: 16,
  padding: "0 28px 28px",
};

const cardBannerStyle = {
  margin: "0 -28px",
  height: 110,
  background: "linear-gradient(135deg, #0d1b2a 0%, #1a2f45 40%, #0e3460 100%)",
  backgroundImage: `linear-gradient(135deg, #0d1b2a 0%, #1a2f45 40%, #0e3460 100%), ${BG_IMAGE}`,
  backgroundBlendMode: "normal",
};

const avatarStyle = {
  width: 90,
  height: 90,
  borderRadius: "50%",
  objectFit: "cover",
  display: "block",
  margin: "0 auto 10px",
  border: "4px solid white",
  boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
};

const btnAlterar = {
  padding: "5px 14px",
  background: "transparent",
  color: "#0A5C8E",
  border: "1px solid #0A5C8E",
  borderRadius: 20,
  fontSize: 13,
  cursor: "pointer",
  marginTop: 2,
};

const labelStyle = { display: "block", fontWeight: 600, fontSize: 14, marginBottom: 6, color: "#1E2F3E" };
const inputStyle = { width: "100%", padding: 11, marginBottom: 2, border: "1px solid #E2E8F0", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box" };
const btnPrimary = { padding: "10px 24px", background: "#0A5C8E", color: "white", border: "none", borderRadius: 40, fontWeight: 600, fontSize: 14, cursor: "pointer", marginTop: 4 };
const btnOutline = { padding: "8px 18px", background: "transparent", color: "#5C6F87", border: "1px solid #E2E8F0", borderRadius: 40, fontSize: 14, cursor: "pointer" };