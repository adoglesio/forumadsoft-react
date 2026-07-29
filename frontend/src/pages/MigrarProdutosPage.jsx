import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import api, { listarProdutos } from "../services/api";

export default function MigrarProdutosPage({ onVoltar }) {
  const { user } = useAuth();
  const { tema } = useTheme();
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
    // Pré-preencher com produto já salvo
    const map = {};
    errosResp.forEach(e => { if (e.produto_id) map[e.id] = e.produto_id; });
    setSelecoes(map);
  }

  function setProduto(erroId, produtoId) {
    setSelecoes(prev => ({ ...prev, [erroId]: produtoId }));
  }

  // Selecionar produto para TODOS os erros filtrados de uma vez
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
    <div style={{ textAlign: "center", padding: 60, color: tema.textoMutado }}>
      <p style={{ fontSize: 40 }}>🔒</p>
      <p>Acesso restrito a administradores.</p>
      <button onClick={onVoltar} style={btnPrimary}>Voltar</button>
    </div>
  );

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>
      {/* Cabeçalho */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button onClick={onVoltar} style={btnOutline(tema)}>← Voltar</button>
        <div>
          <h2 style={{ margin: 0, color: tema.textoPrimario, fontSize: 20, fontWeight: 700 }}>
            🗂️ Vincular Erros a Produtos
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: tema.textoMutado }}>
            Selecione o produto de cada erro para ativar os filtros
          </p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total de erros", valor: erros.length, cor: tema.statCor1, bg: tema.statBg1 },
          { label: "Sem produto", valor: semProduto, cor: "#DC2626", bg: "#FFF5F5" },
          { label: "Vinculados", valor: comProduto, cor: "#16A34A", bg: "#F0FDF4" },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: 12, padding: "14px", textAlign: "center", border: `1px solid ${s.cor}22` }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: s.cor }}>{s.valor}</div>
            <div style={{ fontSize: 12, color: tema.textoSecundario, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Aplicar para todos */}
      <div style={{ background: tema.cardBg, borderRadius: 14, padding: "14px 18px", marginBottom: 16, border: `1px solid ${tema.asideBorder}`, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: tema.textoPrimario }}>Aplicar para todos:</span>
        {produtos.map(p => (
          <button
            key={p.id}
            onClick={() => aplicarParaTodos(p.id)}
            style={{ padding: "5px 14px", borderRadius: 8, border: `1px solid ${p.cor}`, background: p.cor + "18", color: p.cor, cursor: "pointer", fontSize: 12, fontWeight: 600 }}
          >
            {p.nome}
          </button>
        ))}
        <button
          onClick={() => aplicarParaTodos(null)}
          style={{ padding: "5px 14px", borderRadius: 8, border: `1px solid ${tema.inputBorder}`, background: "transparent", color: tema.textoMutado, cursor: "pointer", fontSize: 12 }}
        >
          Limpar seleção
        </button>
      </div>

      {/* Filtro */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button
          onClick={() => setFiltroSemProduto(true)}
          style={{ padding: "6px 16px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, background: filtroSemProduto ? "#FFF5F5" : tema.cardBg, color: filtroSemProduto ? "#DC2626" : tema.textoSecundario, outline: filtroSemProduto ? "2px solid #DC2626" : `1px solid ${tema.inputBorder}` }}
        >
          ❌ Sem produto ({semProduto})
        </button>
        <button
          onClick={() => setFiltroSemProduto(false)}
          style={{ padding: "6px 16px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, background: !filtroSemProduto ? tema.statBg1 : tema.cardBg, color: !filtroSemProduto ? tema.statCor1 : tema.textoSecundario, outline: !filtroSemProduto ? `2px solid ${tema.statCor1}` : `1px solid ${tema.inputBorder}` }}
        >
          📋 Todos os erros ({erros.length})
        </button>
      </div>

      {/* Lista de erros */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
        {errosFiltrados.length === 0 && (
          <div style={{ textAlign: "center", padding: 40, color: tema.textoMutado }}>
            ✅ Todos os erros já estão vinculados a um produto!
          </div>
        )}
        {errosFiltrados.map(e => (
          <div key={e.id} style={{ background: tema.cardBg, borderRadius: 12, padding: "12px 16px", border: `1px solid ${tema.asideBorder}`, display: "flex", alignItems: "center", gap: 12 }}>
            {/* Título */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: tema.textoPrimario, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {e.titulo}
              </div>
              <div style={{ fontSize: 11, color: tema.textoMutado, marginTop: 2 }}>
                por {e.criador_nome} · {new Date(e.created_at).toLocaleDateString("pt-BR")}
              </div>
            </div>

            {/* Seletor de produto */}
            <div style={{ display: "flex", gap: 6, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
              <button
                onClick={() => setProduto(e.id, null)}
                style={{ padding: "4px 10px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600, background: !selecoes[e.id] ? "#fee2e2" : tema.inputBg, color: !selecoes[e.id] ? "#DC2626" : tema.textoMutado, outline: !selecoes[e.id] ? "2px solid #DC2626" : `1px solid ${tema.inputBorder}` }}
              >
                Nenhum
              </button>
              {produtos.map(p => (
                <button
                  key={p.id}
                  onClick={() => setProduto(e.id, p.id)}
                  style={{ padding: "4px 10px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600, background: selecoes[e.id] === p.id ? p.cor : tema.inputBg, color: selecoes[e.id] === p.id ? "white" : tema.textoSecundario, outline: selecoes[e.id] === p.id ? `2px solid ${p.cor}` : `1px solid ${tema.inputBorder}`, transition: "all 0.1s" }}
                >
                  {p.nome}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Barra de progresso */}
      {salvando && (
        <div style={{ background: tema.cardBg, borderRadius: 12, padding: 16, marginBottom: 16, border: `1px solid ${tema.asideBorder}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: tema.textoPrimario, fontWeight: 600 }}>Salvando...</span>
            <span style={{ fontSize: 13, color: tema.textoMutado }}>{progresso.feitos}/{progresso.total}</span>
          </div>
          <div style={{ background: tema.pageBg, borderRadius: 20, height: 8, overflow: "hidden" }}>
            <div style={{ background: "#0A5C8E", height: "100%", borderRadius: 20, width: `${(progresso.feitos / progresso.total) * 100}%`, transition: "width 0.3s" }} />
          </div>
        </div>
      )}

      {concluido && (
        <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 12, padding: 14, marginBottom: 16, textAlign: "center" }}>
          <span style={{ color: "#16A34A", fontWeight: 600 }}>✅ Todos os produtos foram salvos com sucesso!</span>
        </div>
      )}

      {/* Botão salvar */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <button onClick={onVoltar} style={btnOutline(tema)}>Cancelar</button>
        <button
          onClick={salvarTodos}
          disabled={salvando}
          style={{ padding: "10px 28px", background: "#0A5C8E", color: "white", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontSize: 14 }}
        >
          {salvando ? "Salvando..." : "💾 Salvar todos"}
        </button>
      </div>
    </div>
  );
}

const btnPrimary = { padding: "10px 24px", background: "#0A5C8E", color: "white", border: "none", borderRadius: 40, fontWeight: 600, cursor: "pointer" };
const btnOutline = (tema) => ({ padding: "8px 16px", background: "transparent", color: tema.textoSecundario, border: `1px solid ${tema.inputBorder}`, borderRadius: 10, cursor: "pointer", fontSize: 13 });