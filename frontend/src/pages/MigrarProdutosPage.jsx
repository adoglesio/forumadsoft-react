import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api, { listarProdutos } from "../services/api";
import { IoLockClosedOutline, IoLinkOutline, IoCheckmarkCircle, IoSaveOutline } from "react-icons/io5";

export default function MigrarProdutosPage({ onVoltar }) {
  const { user } = useAuth();
  const [erros, setErros] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [selecoes, setSelecoes] = useState({});
  const [salvando, setSalvando] = useState(false);
  const [progresso, setProgresso] = useState({ feitos: 0, total: 0 });
  const [concluido, setConcluido] = useState(false);
  const [filtroSemProduto, setFiltroSemProduto] = useState(true);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    const [errosResp, prods] = await Promise.all([
      api.get("/erros").then(r => r.data.data),
      listarProdutos(),
    ]);
    setErros(errosResp);
    setProdutos(prods);
    const map = {};
    errosResp.forEach(e => { if (e.produto_id) map[e.id] = e.produto_id; });
    setSelecoes(map);
  }

  function setProduto(erroId, produtoId) {
    setSelecoes(prev => ({ ...prev, [erroId]: produtoId }));
  }

  function aplicarParaTodos(produtoId) {
    const ids = errosFiltrados.map(e => e.id);
    setSelecoes(prev => {
      const novo = { ...prev };
      ids.forEach(id => { novo[id] = produtoId; });
      return novo;
    });
  }

  async function salvarTodos() {
    const lista = erros.filter(e => selecoes[e.id] !== undefined);

    if (lista.length === 0) {
      alert("Nenhum erro selecionado! Escolha um produto para pelo menos um erro.");
      return;
    }

    setSalvando(true);
    setProgresso({ feitos: 0, total: lista.length });

    for (let i = 0; i < lista.length; i++) {
      const e = lista[i];
      try {
        await api.put(`/erros/${e.id}`, {
          produto_id: selecoes[e.id] || null,
          usuario_email: user.email,
        });
      } catch {}
      setProgresso({ feitos: i + 1, total: lista.length });
    }

    setSalvando(false);
    setConcluido(true);
    await carregar();
  }

  const errosFiltrados = filtroSemProduto
    ? erros.filter(e => !e.produto_id)
    : erros;

  const semProduto = erros.filter(e => !e.produto_id).length;
  const comProduto = erros.filter(e => e.produto_id).length;

  if (!user?.isAdmin) return (
    <div className="empty-state">
      <IoLockClosedOutline size={40} style={{ marginBottom: 8 }} />
      <p>Acesso restrito a administradores.</p>
      <button onClick={onVoltar} className="btn btn-primary">Voltar</button>
    </div>
  );

  return (
    <div className="app-narrow" style={{ maxWidth: 900 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, color: "var(--text)", fontSize: 20, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
            <IoLinkOutline size={19} /> Vincular erros a produtos
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--text-muted)" }}>
            Selecione o produto de cada erro para ativar os filtros
          </p>
        </div>
      </div>

      <div className="grid-3" style={{ marginBottom: 20 }}>
        {[
          { label: "Total de erros", valor: erros.length, cor: "var(--primary)", bg: "var(--primary-soft)" },
          { label: "Sem produto", valor: semProduto, cor: "var(--danger)", bg: "var(--danger-bg)" },
          { label: "Vinculados", valor: comProduto, cor: "var(--success)", bg: "var(--success-bg)" },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ background: s.bg }}>
            <div className="stat-card-value" style={{ color: s.cor }}>{s.valor}</div>
            <div className="stat-card-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: "14px 18px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Aplicar para todos:</span>
        {produtos.map(p => (
          <button
            key={p.id}
            onClick={() => aplicarParaTodos(p.id)}
            className="chip"
            style={{ borderColor: p.cor, background: p.cor + "18", color: p.cor }}
          >
            {p.nome}
          </button>
        ))}
        <button onClick={() => aplicarParaTodos(null)} className="chip">
          Limpar seleção
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <button
          onClick={() => setFiltroSemProduto(true)}
          className={`chip ${filtroSemProduto ? "chip-active" : ""}`}
          style={{ background: filtroSemProduto ? "var(--danger-bg)" : undefined, color: filtroSemProduto ? "var(--danger)" : undefined }}
        >
          Sem produto ({semProduto})
        </button>
        <button
          onClick={() => setFiltroSemProduto(false)}
          className={`chip ${!filtroSemProduto ? "chip-active" : ""}`}
          style={{ background: !filtroSemProduto ? "var(--primary-soft)" : undefined, color: !filtroSemProduto ? "var(--primary)" : undefined }}
        >
          Todos os erros ({erros.length})
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
        {errosFiltrados.length === 0 && (
          <div className="empty-state" style={{ padding: 40 }}>
            <IoCheckmarkCircle size={22} style={{ marginBottom: 4, color: "var(--success)" }} />
            <p>Todos os erros já estão vinculados a um produto!</p>
          </div>
        )}
        {errosFiltrados.map(e => (
          <div key={e.id} className="card" style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 160 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {e.titulo}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                por {e.criador_nome} · {new Date(e.created_at).toLocaleDateString("pt-BR")}
              </div>
            </div>

            <div style={{ display: "flex", gap: 6, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
              <button
                onClick={() => setProduto(e.id, null)}
                className="chip btn-sm"
                style={{ background: !selecoes[e.id] ? "var(--danger-bg)" : undefined, color: !selecoes[e.id] ? "var(--danger)" : undefined, padding: "4px 10px", fontSize: 11 }}
              >
                Nenhum
              </button>
              {produtos.map(p => (
                <button
                  key={p.id}
                  onClick={() => setProduto(e.id, p.id)}
                  className="chip"
                  style={{ background: selecoes[e.id] === p.id ? p.cor : undefined, color: selecoes[e.id] === p.id ? "white" : undefined, padding: "4px 10px", fontSize: 11 }}
                >
                  {p.nome}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {salvando && (
        <div className="card" style={{ padding: 16, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: "var(--text)", fontWeight: 600 }}>Salvando...</span>
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{progresso.feitos}/{progresso.total}</span>
          </div>
          <div style={{ background: "var(--surface-alt)", borderRadius: 20, height: 8, overflow: "hidden" }}>
            <div style={{ background: "var(--primary)", height: "100%", borderRadius: 20, width: `${(progresso.feitos / progresso.total) * 100}%`, transition: "width 0.3s" }} />
          </div>
        </div>
      )}

      {concluido && (
        <div style={{ background: "var(--success-bg)", border: "1px solid var(--success-border)", borderRadius: "var(--radius-md)", padding: 14, marginBottom: 16, textAlign: "center" }}>
          <span style={{ color: "var(--success)", fontWeight: 600 }}>Todos os produtos foram salvos com sucesso!</span>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <button onClick={onVoltar} className="btn btn-secondary">Cancelar</button>
        <button onClick={salvarTodos} disabled={salvando} className="btn btn-primary">
          <IoSaveOutline size={15} /> {salvando ? "Salvando..." : "Salvar todos"}
        </button>
      </div>
    </div>
  );
}
