import { excluirErro } from "../services/api";
import Reacoes from "./Reacoes";
import LogoProduto from "./LogoProduto";
import { IoTrashOutline, IoCheckmarkCircle, IoChatbubbleOutline } from "react-icons/io5";

export default function ErroCard({ erro, user, onAtualizar, onVerDetalhes }) {
  const ehDono = user?.email === erro.criador_email;
  const ehAdmin = user?.isAdmin;

  async function handleExcluir(e) {
    e.stopPropagation();
    if (!window.confirm("Excluir este erro permanentemente?")) return;
    await excluirErro(erro.id, user.email);
    onAtualizar();
  }

  return (
    <div
      className="card card-interactive"
      style={{ padding: 20, marginBottom: 14 }}
      onClick={() => onVerDetalhes(erro.id)}
    >
      {erro.imagem && (
        <img src={erro.imagem} alt="" style={{ width: "100%", maxHeight: 140, objectFit: "cover", borderRadius: 10, marginBottom: 12 }} />
      )}

      {erro.produto_nome && (
        <div style={{ marginBottom: 8 }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: erro.produto_cor + "18",
            border: `1px solid ${erro.produto_cor}44`,
            borderLeft: `3px solid ${erro.produto_cor}`,
            borderRadius: 6, padding: "3px 10px",
          }}>
            <LogoProduto icone={erro.produto_icone} nome={erro.produto_nome} cor={erro.produto_cor} size="sm" style={{ height: 14, maxWidth: 60 }} />
          </span>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <h3 style={{ margin: 0, color: "var(--text)", fontSize: 15, fontWeight: 600, lineHeight: 1.4, flex: 1 }}>{erro.titulo}</h3>
        {(ehAdmin || ehDono) && (
          <button onClick={handleExcluir} className="btn-icon btn-ghost" style={{ color: "var(--danger)", flexShrink: 0, border: "none" }} title="Excluir">
            <IoTrashOutline size={16} />
          </button>
        )}
      </div>

      <p style={{ margin: "8px 0", color: "var(--text-secondary)", fontSize: 13, lineHeight: 1.6 }}>
        {erro.descricao.substring(0, 120)}{erro.descricao.length > 120 ? "..." : ""}
      </p>

      {erro.solucao && (
        <div style={{ background: "var(--success-bg)", border: "1px solid var(--success-border)", borderRadius: 8, padding: "5px 12px", marginTop: 8, display: "inline-flex", alignItems: "center", gap: 6 }}>
          <IoCheckmarkCircle size={14} color="var(--success)" />
          <strong style={{ color: "var(--success)", fontSize: 12 }}>Solução disponível</strong>
        </div>
      )}

      <div style={{ marginTop: 12 }} onClick={e => e.stopPropagation()}>
        <Reacoes erroId={erro.id} user={user} />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
        <small style={{ color: "var(--text-muted)", fontSize: 12 }}>
          Por <strong style={{ color: "var(--text-secondary)" }}>{erro.criador_nome}</strong> · {new Date(erro.created_at).toLocaleDateString("pt-BR")}
        </small>
        <small style={{ color: "var(--text-secondary)", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
          <IoChatbubbleOutline size={13} /> {erro.comentarios?.length || 0}
        </small>
      </div>
    </div>
  );
}
