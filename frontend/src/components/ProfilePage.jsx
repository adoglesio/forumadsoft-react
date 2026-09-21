import { useState, useRef } from "react";
import { IoLogOut, IoSave, IoCamera, IoChevronForward } from "react-icons/io5";
import { useAuth } from "../context/AuthContext";
import { atualizarPerfil, alterarSenha } from "../services/api";
import { pararPresence } from "../services/presence";

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
    if (novaSenha !== confirmar) { setSenhaMsg("Senhas não coincidem."); return; }
    if (novaSenha.length < 4) { setSenhaMsg("Mínimo 4 caracteres."); return; }
    try {
      await alterarSenha({ email: user.email, senhaAtual, novaSenha });
      setSenhaMsg("Senha alterada!");
      setSenhaAtual(""); setNovaSenha(""); setConfirmar("");
    } catch (e) { setSenhaMsg(e.response?.data?.error || "Erro."); }
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
    <div className="app-narrow" style={{ maxWidth: 600 }}>
      <div className="card" style={{ overflow: "hidden", padding: "0 28px 28px" }}>
        <div style={{
          margin: "0 -28px", height: 100,
          backgroundImage: `linear-gradient(135deg, #0d1b2a 0%, #1a2f45 40%, #0e3460 100%), ${BG_IMAGE}`,
        }} />

        <div style={{ textAlign: "center", position: "relative", marginTop: -44, marginBottom: 16 }}>
          {user?.avatar
            ? <img src={user.avatar} alt="" style={avatarStyle} />
            : <div style={{ ...avatarStyle, background: "var(--primary)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 30 }}>
                {user?.nome?.charAt(0)?.toUpperCase()}
              </div>
          }
          <button onClick={() => fileRef.current.click()} className="btn btn-secondary btn-sm">
            <IoCamera size={13} />Alterar foto
          </button>
          <input type="file" ref={fileRef} accept="image/*" style={{ display: "none" }} onChange={handleAvatar} />
          <h3 style={{ margin: "10px 0 4px", color: "var(--text)", fontSize: 19, fontWeight: 700 }}>{user?.nome}</h3>
          <p style={{ color: "var(--text-secondary)", margin: 0, fontSize: 13 }}>{user?.email}</p>
          {user?.isAdmin && (
            <span className="badge" style={{ background: "#F6C64B", color: "#4A3300", marginTop: 8 }}>
              Administrador
            </span>
          )}
        </div>

        <div className="field">
          <label className="field-label">Bio</label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="textarea" />
        </div>
        <button onClick={salvarPerfil} className="btn btn-primary"><IoSave size={14} />Salvar perfil</button>
        {perfilMsg && <p className={`form-message ${perfilMsg.includes("Erro") ? "form-message-error" : "form-message-success"}`}>{perfilMsg}</p>}

        <hr style={{ margin: "24px 0", border: "none", borderTop: "1px solid var(--border)" }} />

        <details style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: 16 }}>
          <summary style={{ cursor: "pointer", fontWeight: 600, color: "var(--primary)", display: "flex", alignItems: "center", gap: 6, listStyle: "none" }}>
            <IoChevronForward size={13} /> Trocar senha
          </summary>
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
            <input type="password" placeholder="Senha atual" value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} className="input" />
            <input type="password" placeholder="Nova senha" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} className="input" />
            <input type="password" placeholder="Confirmar nova senha" value={confirmar} onChange={(e) => setConfirmar(e.target.value)} className="input" />
            <button onClick={trocarSenha} className="btn btn-primary">Trocar senha</button>
            {senhaMsg && <p className={`form-message ${senhaMsg.includes("Erro") || senhaMsg.includes("não") || senhaMsg.includes("Mínimo") ? "form-message-error" : "form-message-success"}`}>{senhaMsg}</p>}
          </div>
        </details>

        <button
          onClick={() => { pararPresence(); logout(); }}
          className="btn btn-danger btn-block"
          style={{ marginTop: 20 }}
        >
          <IoLogOut size={15} /> Sair da conta
        </button>
      </div>
    </div>
  );
}

const avatarStyle = {
  width: 88, height: 88, borderRadius: "50%", objectFit: "cover",
  display: "block", margin: "0 auto 10px",
  border: "4px solid var(--surface)", boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
};
