import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { listarProcedimentos, excluirProcedimento, listarProdutos } from "../services/api";
import { removerProcedimentoPDF } from "../services/storage";
import LogoProduto from "../components/LogoProduto";
import NovoProcedimentoModal from "../components/NovoProcedimentoModal";
import { IoDocumentText, IoDownloadOutline, IoTrashOutline, IoSearch } from "react-icons/io5";
import { FaRegFolderOpen } from "react-icons/fa";

export default function ProcedimentosPage() {
  const { user } = useAuth();
  const [procedimentos, setProcedimentos] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [produtoFiltro, setProdutoFiltro] = useState("");
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [showNovo, setShowNovo] = useState(false);

  useEffect(() => { carregar(); }, [produtoFiltro]);
  useEffect(() => { listarProdutos().then(setProdutos).catch(() => {}); }, []);

  async function carregar() {
    setCarregando(true);
    try {
      const lista = await listarProcedimentos(produtoFiltro);
      setProcedimentos(lista);
    } finally {
      setCarregando(false);
    }
  }

  async function handleExcluir(p) {
    if (!window.confirm(`Excluir o procedimento "${p.titulo}"?`)) return;
    await excluirProcedimento(p.id, user.email);
    await removerProcedimentoPDF(p.arquivo_url);
    carregar();
  }

  const filtrados = procedimentos.filter(p =>
    !busca || p.titulo.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="app-narrow" style={{ maxWidth: 760 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <h2 style={{ margin: 0, color: "var(--text)", fontSize: 20, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
          <IoDocumentText size={20} /> Procedimentos
        </h2>
        <button onClick={() => setShowNovo(true)} className="btn btn-primary btn-sm">+ Novo procedimento</button>
      </div>

      {produtos.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          <button
            onClick={() => setProdutoFiltro("")}
            className={`chip ${!produtoFiltro ? "chip-active" : ""}`}
            style={{ background: !produtoFiltro ? "var(--primary-soft)" : undefined, color: !produtoFiltro ? "var(--primary)" : undefined }}
            title="Todos os produtos"
          >
            <FaRegFolderOpen />
          </button>
          {produtos.map(p => (
            <button
              key={p.id}
              onClick={() => setProdutoFiltro(produtoFiltro === p.id ? "" : p.id)}
              className={`chip ${produtoFiltro === p.id ? "chip-active" : ""}`}
              style={{ background: produtoFiltro === p.id ? p.cor : undefined, color: produtoFiltro === p.id ? "white" : undefined }}
            >
              {p.nome}
            </button>
          ))}
        </div>
      )}

      <div style={{ position: "relative", marginBottom: 20 }}>
        <IoSearch size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
        <input
          placeholder="Buscar procedimento..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          className="input"
          style={{ paddingLeft: 38 }}
        />
      </div>

      {carregando ? (
        <div className="empty-state"><div className="skeleton-spinner" /></div>
      ) : filtrados.length === 0 ? (
        <div className="empty-state">
          <p style={{ marginBottom: 16 }}>Nenhum procedimento cadastrado ainda.</p>
          <button onClick={() => setShowNovo(true)} className="btn btn-primary">+ Cadastrar o primeiro</button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtrados.map(p => (
            <div key={p.id} className="card" style={{ padding: 16, display: "flex", alignItems: "flex-start", gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--danger-bg)", color: "var(--danger)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <IoDocumentText size={20} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                {p.produto_nome && (
                  <div style={{ marginBottom: 4 }}>
                    <LogoProduto icone={p.produto_icone} nome={p.produto_nome} cor={p.produto_cor} size="sm" style={{ height: 13, maxWidth: 60 }} />
                  </div>
                )}
                <h3 style={{ margin: 0, color: "var(--text)", fontSize: 15, fontWeight: 600 }}>{p.titulo}</h3>
                {p.descricao && <p style={{ margin: "4px 0 0", color: "var(--text-secondary)", fontSize: 13, lineHeight: 1.5 }}>{p.descricao}</p>}
                <small style={{ color: "var(--text-muted)", fontSize: 12, display: "block", marginTop: 6 }}>
                  Por <strong style={{ color: "var(--text-secondary)" }}>{p.criador_nome}</strong> · {new Date(p.created_at).toLocaleDateString("pt-BR")}
                </small>
              </div>

              <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                <a href={p.arquivo_url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" title="Abrir PDF">
                  <IoDownloadOutline size={14} /> Abrir
                </a>
                {(user?.isAdmin || user?.email === p.criador_email) && (
                  <button onClick={() => handleExcluir(p)} className="btn-icon btn-ghost" style={{ color: "var(--danger)", border: "none" }} title="Excluir">
                    <IoTrashOutline size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showNovo && <NovoProcedimentoModal onClose={() => setShowNovo(false)} onCriado={carregar} />}
    </div>
  );
}
