import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { criarProcedimento, listarProdutos, getProdutosUsuario } from "../services/api";
import { uploadProcedimentoPDF } from "../services/storage";
import LogoProduto from "./LogoProduto";
import { IoDocumentText, IoClose, IoCloudUploadOutline } from "react-icons/io5";

export default function NovoProcedimentoModal({ onClose, onCriado }) {
  const { user } = useAuth();
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [arquivo, setArquivo] = useState(null);
  const [produtoId, setProdutoId] = useState("");
  const [produtos, setProdutos] = useState([]);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [progresso, setProgresso] = useState("");

  useEffect(() => {
    async function carregarProdutos() {
      try {
        const todos = await listarProdutos();
        const meus = await getProdutosUsuario(user.email);
        setProdutos(user.isAdmin ? todos : todos.filter(p => meus.includes(p.id)));
      } catch {}
    }
    carregarProdutos();
  }, [user]);

  function handleArquivo(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      setErro("Só é permitido arquivo em PDF.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setErro("O arquivo precisa ter até 20 MB.");
      return;
    }
    setErro("");
    setArquivo(file);
  }

  async function handleSubmit() {
    if (!titulo.trim()) { setErro("Dê um título ao procedimento."); return; }
    if (!arquivo) { setErro("Selecione um arquivo PDF."); return; }

    setEnviando(true);
    setErro("");
    try {
      setProgresso("Enviando arquivo...");
      const { url, nome } = await uploadProcedimentoPDF(arquivo);

      setProgresso("Salvando...");
      await criarProcedimento({
        titulo,
        descricao,
        arquivo_url: url,
        arquivo_nome: nome,
        produto_id: produtoId || null,
        criador_email: user.email,
        criador_nome: user.nome,
      });

      onCriado();
      onClose();
    } catch (e) {
      setErro(e.message || "Não foi possível enviar o arquivo.");
    } finally {
      setEnviando(false);
      setProgresso("");
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(8,14,22,0.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div className="card" style={{ padding: 28, width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto", boxShadow: "var(--shadow-pop)", animation: "df-pop-in 0.2s ease" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, color: "var(--text)", fontSize: 18, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
            <IoDocumentText size={20} /> Novo procedimento
          </h3>
          <button onClick={onClose} className="btn-icon btn-ghost" style={{ border: "none" }} aria-label="Fechar"><IoClose size={20} /></button>
        </div>

        {produtos.length > 0 && (
          <div className="field">
            <label className="field-label">Produto (opcional)</label>
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
          <input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex: Como emitir NF-e com desconto" className="input" />
        </div>

        <div className="field">
          <label className="field-label">Descrição (opcional)</label>
          <textarea value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Uma linha explicando do que se trata..." rows={3} className="textarea" />
        </div>

        <div className="field" style={{ marginBottom: 20 }}>
          <label className="field-label field-required">Arquivo PDF</label>
          <label style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            border: "2px dashed var(--input-border)", borderRadius: "var(--radius-sm)",
            padding: "20px 16px", cursor: "pointer", color: "var(--text-secondary)", fontSize: 13,
          }}>
            <IoCloudUploadOutline size={20} />
            {arquivo ? arquivo.name : "Clique para escolher o PDF (até 20 MB)"}
            <input type="file" accept="application/pdf" onChange={handleArquivo} style={{ display: "none" }} />
          </label>
        </div>

        {erro && <p className="form-message form-message-error" style={{ marginBottom: 12 }}>{erro}</p>}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} className="btn btn-secondary" disabled={enviando}>Cancelar</button>
          <button onClick={handleSubmit} disabled={enviando} className="btn btn-primary">
            {enviando ? (progresso || "Enviando...") : "Cadastrar procedimento"}
          </button>
        </div>
      </div>
    </div>
  );
}
