import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { criarErro, listarProdutos, getProdutosUsuario } from "../services/api";
import LogoProduto from "./LogoProduto";
import { MdReportGmailerrorred } from "react-icons/md";
import { IoClose } from "react-icons/io5";

export default function NovoErroModal({ onClose, onCriado }) {
  const { user } = useAuth();
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
    <div style={{ position: "fixed", inset: 0, background: "rgba(8,14,22,0.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div className="card" style={{ padding: 28, width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto", boxShadow: "var(--shadow-pop)", animation: "df-pop-in 0.2s ease" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, color: "var(--text)", fontSize: 18, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}><MdReportGmailerrorred size={20} /> Reportar erro</h3>
          <button onClick={onClose} className="btn-icon btn-ghost" style={{ border: "none" }} aria-label="Fechar"><IoClose size={20} /></button>
        </div>

        {produtos.length > 0 && (
          <div className="field">
            <label className="field-label">Produto</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {produtos.map(p => (
                <button
                  key={p.id}
                  onClick={() => setProdutoId(produtoId === p.id ? "" : p.id)}
                  className={`chip ${produtoId === p.id ? "chip-active" : ""}`}
                  style={{ background: produtoId === p.id ? p.cor : undefined, color: produtoId === p.id ? "white" : undefined }}
                >
                  <LogoProduto icone={p.icone} nome={p.nome} cor={p.cor} size="sm" style={{ height: 14, maxWidth: 70, filter: produtoId === p.id ? "brightness(10)" : "none" }} />
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="field">
          <label className="field-label field-required">Título</label>
          <input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Descreva o erro brevemente" className="input" />
        </div>

        <div className="field">
          <label className="field-label field-required">Descrição</label>
          <textarea value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Detalhe o problema..." rows={4} className="textarea" />
        </div>

        <div className="field">
          <label className="field-label">Solução (opcional)</label>
          <textarea value={solucao} onChange={e => setSolucao(e.target.value)} placeholder="Se já souber a solução..." rows={3} className="textarea" />
        </div>

        <div className="field" style={{ marginBottom: 20 }}>
          <label className="field-label">Imagem (opcional)</label>
          <input type="file" accept="image/*" onChange={handleImagem} style={{ fontSize: 13, color: "var(--text-secondary)" }} />
          {imagem && <img src={imagem} alt="" style={{ width: "100%", borderRadius: 8, marginTop: 8, maxHeight: 120, objectFit: "cover" }} />}
        </div>

        {erro && <p className="form-message form-message-error" style={{ marginBottom: 12 }}>{erro}</p>}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} className="btn btn-secondary">Cancelar</button>
          <button onClick={handleSubmit} disabled={salvando} className="btn btn-primary">
            {salvando ? "Salvando..." : "Reportar erro"}
          </button>
        </div>
      </div>
    </div>
  );
}
