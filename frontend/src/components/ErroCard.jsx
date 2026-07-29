import { useTheme } from "../context/ThemeContext";
import { excluirErro } from "../services/api";
import Reacoes from "./Reacoes";
import LogoProduto from "./LogoProduto";

export default function ErroCard({ erro, user, onAtualizar, onVerDetalhes }) {
  const { tema } = useTheme();
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
      style={{ background: tema.cardBg, borderRadius: 16, padding: 20, marginBottom: 16, boxShadow: tema.cardSombra, border: `1px solid ${tema.asideBorder}`, cursor: "pointer", transition: "transform 0.15s, box-shadow 0.15s" }}
      onClick={() => onVerDetalhes(erro.id)}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.1)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = tema.cardSombra; }}
    >
      {erro.imagem && (
        <img src={erro.imagem} alt="" style={{ width: "100%", maxHeight: 140, objectFit: "cover", borderRadius: 10, marginBottom: 12 }} />
      )}

      {/* Badge do produto */}
      {erro.produto_nome && (
        <div style={{ marginBottom: 8 }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: erro.produto_cor + "18",
            border: `1px solid ${erro.produto_cor}44`,
            borderLeft: `3px solid ${erro.produto_cor}`,
            borderRadius: 6, padding: "3px 10px",
          }}>
            <LogoProduto
              icone={erro.produto_icone}
              nome={erro.produto_nome}
              cor={erro.produto_cor}
              size="sm"
              style={{ height: 14, maxWidth: 60 }}
            />
          </span>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <h3 style={{ margin: 0, color: tema.textoPrimario, fontSize: 15, fontWeight: 600, lineHeight: 1.4, flex: 1 }}>{erro.titulo}</h3>
        {(ehAdmin || ehDono) && (
          <button onClick={handleExcluir} style={{ background: "none", border: "none", color: "#DC2626", cursor: "pointer", fontSize: 15, padding: "2px 6px", flexShrink: 0 }}>🗑️</button>
        )}
      </div>

      <p style={{ margin: "8px 0", color: tema.textoSecundario, fontSize: 13, lineHeight: 1.5 }}>
        {erro.descricao.substring(0, 120)}{erro.descricao.length > 120 ? "..." : ""}
      </p>

      {erro.solucao && (
        <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 8, padding: "5px 12px", marginTop: 8 }}>
          <strong style={{ color: "#2C7A4D", fontSize: 12 }}>✅ Solução disponível</strong>
        </div>
      )}

      <div style={{ marginTop: 12 }} onClick={e => e.stopPropagation()}>
        <Reacoes erroId={erro.id} user={user} />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
        <small style={{ color: tema.textoMutado, fontSize: 12 }}>
          Por <strong>{erro.criador_nome}</strong> · {new Date(erro.created_at).toLocaleDateString("pt-BR")}
        </small>
        <small style={{ color: tema.textoSecundario, fontSize: 12 }}>
          💬 {erro.comentarios?.length || 0}
        </small>
      </div>
    </div>
  );
}