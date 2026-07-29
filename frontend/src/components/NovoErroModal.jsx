import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { criarErro, listarProdutos, getProdutosUsuario } from "../services/api";
import LogoProduto from "./LogoProduto";
import { MdReportGmailerrorred } from "react-icons/md";

export default function NovoErroModal({ onClose, onCriado }) {
  const { user } = useAuth();
  const { tema } = useTheme();
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [solucao, setSolucao] = useState("");
  const [imagem, setImagem] = useState(null);
  const [produtoId, setProdutoId] = useState("");
  const [produtos, setProdutos] = useState([]);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    async function carregarProdutos() {
      try {
        const todos = await listarProdutos();
        const meus = await getProdutosUsuario(user.email);
        // Mostrar só os produtos que o usuário tem acesso
        const filtrados = user.isAdmin ? todos : todos.filter(p => meus.includes(p.id));
        setProdutos(filtrados);
        if (filtrados.length === 1) setProdutoId(filtrados[0].id);
      } catch {}
    }
    carregarProdutos();
  }, [user]);

  async function handleSubmit() {
    if (!titulo.trim() || !descricao.trim()) { setErro("Título e descrição são obrigatórios."); return; }
    setSalvando(true);
    try {
      await criarErro({ titulo, descricao, solucao, imagem, produto_id: produtoId || null, criador_email: user.email, criador_nome: user.nome });
      onCriado();
      onClose();
    } catch (e) { setErro(e.message); }
    setSalvando(false);
  }

  function handleImagem(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setImagem(ev.target.result);
    reader.readAsDataURL(file);
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: tema.cardBg, borderRadius: 20, padding: 28, width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 16px 48px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, color: tema.textoPrimario, fontSize: 18, fontWeight: 700 }}><MdReportGmailerrorred /> Reportar Erro</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: tema.textoMutado }}>×</button>
        </div>

        {/* Produto */}
        {produtos.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle(tema)}>Produto</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {produtos.map(p => (
                <button
                  key={p.id}
                  onClick={() => setProdutoId(produtoId === p.id ? "" : p.id)}
                  style={{
                    padding: "6px 16px", borderRadius: 20, border: "none",
                    cursor: "pointer", fontSize: 13, fontWeight: 600,
                    background: produtoId === p.id ? p.cor : tema.inputBg,
                    color: produtoId === p.id ? "white" : tema.textoSecundario,
                    outline: produtoId === p.id ? `2px solid ${p.cor}` : `1px solid ${tema.inputBorder}`,
                    transition: "all 0.15s",
                  }}
                >
                  <LogoProduto icone={p.icone} nome={p.nome} cor={p.cor} size="sm" style={{ height: 14, maxWidth: 70, filter: produtoId === p.id ? "brightness(10)" : "none" }} />
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle(tema)}>Título *</label>
          <input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Descreva o erro brevemente" style={inputStyle(tema)} />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle(tema)}>Descrição *</label>
          <textarea value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Detalhe o problema..." rows={4} style={{ ...inputStyle(tema), resize: "vertical" }} />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle(tema)}>Solução (opcional)</label>
          <textarea value={solucao} onChange={e => setSolucao(e.target.value)} placeholder="Se já souber a solução..." rows={3} style={{ ...inputStyle(tema), resize: "vertical" }} />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle(tema)}>Imagem (opcional)</label>
          <input type="file" accept="image/*" onChange={handleImagem} style={{ fontSize: 13, color: tema.textoSecundario }} />
          {imagem && <img src={imagem} alt="" style={{ width: "100%", borderRadius: 8, marginTop: 8, maxHeight: 120, objectFit: "cover" }} />}
        </div>

        {erro && <p style={{ color: "#DC2626", fontSize: 13, marginBottom: 12 }}>{erro}</p>}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "10px 20px", background: "transparent", border: `1px solid ${tema.inputBorder}`, borderRadius: 40, cursor: "pointer", color: tema.textoSecundario }}>Cancelar</button>
          <button onClick={handleSubmit} disabled={salvando} style={{ padding: "10px 24px", background: "#0A5C8E", color: "white", border: "none", borderRadius: 40, fontWeight: 600, cursor: "pointer" }}>
            {salvando ? "Salvando..." : "Reportar Erro"}
          </button>
        </div>
      </div>
    </div>
  );
}

const labelStyle = (tema) => ({ display: "block", fontWeight: 600, fontSize: 13, marginBottom: 6, color: tema.textoPrimario });
const inputStyle = (tema) => ({ width: "100%", padding: "10px 14px", border: `1px solid ${tema.inputBorder}`, borderRadius: 10, fontSize: 14, outline: "none", background: tema.inputBg, color: tema.textoPrimario, boxSizing: "border-box" });