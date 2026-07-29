import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import api, { listarProdutos, getProdutosUsuario, setProdutosUsuario, criarProduto, deletarProduto } from "../services/api";
import LogoProduto from "../components/LogoProduto";

export default function GestaoUsuariosPage({ onVoltar }) {
  const { user } = useAuth();
  const { tema } = useTheme();
  const [usuarios, setUsuarios] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [selecionado, setSelecionado] = useState(null);
  const [produtosUsuario, setProdutosUsuarioState] = useState([]);
  const [novoProduto, setNovoProduto] = useState("");
  const [corNovo, setCorNovo] = useState("#0A5C8E");
  const [iconeNovo, setIconeNovo] = useState("📦");
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => { carregar(); }, []);

  async function carregar() {
    const [u, p] = await Promise.all([
      api.get("/usuarios/listar").then(r => r.data.data).catch(() => []),
      listarProdutos(),
    ]);
    setUsuarios(u);
    setProdutos(p);
  }

  async function selecionarUsuario(u) {
    setSelecionado(u);
    const ids = await getProdutosUsuario(u.email);
    setProdutosUsuarioState(ids);
  }

  function toggleProduto(id) {
    setProdutosUsuarioState(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  }

  async function salvarProdutos() {
    setSalvando(true);
    await setProdutosUsuario(selecionado.email, produtosUsuario, user.email);
    setMsg("✅ Produtos salvos!");
    setTimeout(() => setMsg(""), 2500);
    setSalvando(false);
  }

  async function handleCriarProduto() {
    if (!novoProduto.trim()) return;
    await criarProduto({ nome: novoProduto.trim(), cor: corNovo, icone: iconeNovo, usuario_email: user.email });
    setNovoProduto("");
    carregar();
  }

  async function handleDeletarProduto(id) {
    if (!confirm("Deletar este produto?")) return;
    await deletarProduto(id, user.email);
    carregar();
  }

  if (!user?.isAdmin) return (
    <div style={{ textAlign: "center", padding: 60, color: tema.textoMutado }}>
      <p style={{ fontSize: 40 }}>🔒</p>
      <p>Acesso restrito a administradores.</p>
      <button onClick={onVoltar} style={btnPrimary}>Voltar</button>
    </div>
  );

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button onClick={onVoltar} style={btnOutline(tema)}>← Voltar</button>
        <h2 style={{ margin: 0, color: tema.textoPrimario, fontSize: 20, fontWeight: 700 }}>
          🗂️ Gestão de Produtos e Usuários
        </h2>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

        {/* ── Coluna esquerda: Produtos */}
        <div>
          <div style={cardStyle(tema)}>
            <h3 style={{ margin: "0 0 16px", color: tema.textoPrimario, fontSize: 16 }}>📦 Produtos</h3>

            {/* Lista de produtos */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
              {produtos.map(p => (
                <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderRadius: 10, border: `1px solid ${tema.inputBorder}`, background: tema.inputBg }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <LogoProduto icone={p.icone} nome={p.nome} cor={p.cor} size="md" />
                  </div>
                  <button onClick={() => handleDeletarProduto(p.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#DC2626", fontSize: 16 }}>🗑️</button>
                </div>
              ))}
            </div>

            {/* Adicionar produto */}
            <div style={{ borderTop: `1px solid ${tema.inputBorder}`, paddingTop: 14 }}>
              <p style={{ margin: "0 0 8px", fontWeight: 600, fontSize: 13, color: tema.textoPrimario }}>Novo produto</p>
              <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                <input value={novoProduto} onChange={e => setNovoProduto(e.target.value)} placeholder="Nome do produto" style={{ ...inputSt(tema), flex: 1 }} />
                <input type="color" value={corNovo} onChange={e => setCorNovo(e.target.value)} style={{ width: 38, height: 38, border: "none", borderRadius: 8, cursor: "pointer", padding: 2 }} title="Cor" />
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <input value={iconeNovo} onChange={e => setIconeNovo(e.target.value)} placeholder="Emoji ícone" style={{ ...inputSt(tema), width: 70 }} maxLength={2} />
                <button onClick={handleCriarProduto} style={btnPrimary}>Adicionar</button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Coluna direita: Usuários */}
        <div>
          <div style={cardStyle(tema)}>
            <h3 style={{ margin: "0 0 16px", color: tema.textoPrimario, fontSize: 16 }}>👥 Usuários</h3>

            <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 280, overflowY: "auto" }}>
              {usuarios.map(u => (
                <div
                  key={u.email}
                  onClick={() => selecionarUsuario(u)}
                  style={{
                    padding: "10px 14px", borderRadius: 10, cursor: "pointer",
                    border: selecionado?.email === u.email ? "2px solid #0A5C8E" : `1px solid ${tema.inputBorder}`,
                    background: selecionado?.email === u.email ? "#EFF7FF" : tema.inputBg,
                    display: "flex", alignItems: "center", gap: 10,
                  }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#0A5C8E", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, flexShrink: 0 }}>
                    {u.nome?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: tema.textoPrimario }}>{u.nome}</div>
                    <div style={{ fontSize: 11, color: tema.textoMutado }}>{u.email}</div>
                  </div>
                  {u.isAdmin && <span style={{ marginLeft: "auto", background: "gold", color: "#333", fontSize: 10, padding: "2px 8px", borderRadius: 20, fontWeight: 600 }}>Admin</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Definir produtos do usuário selecionado */}
          {selecionado && (
            <div style={{ ...cardStyle(tema), marginTop: 16 }}>
              <p style={{ margin: "0 0 12px", fontWeight: 700, fontSize: 14, color: tema.textoPrimario }}>
                Produtos de <span style={{ color: "#0A5C8E" }}>{selecionado.nome}</span>
              </p>

              {selecionado.isAdmin ? (
                <p style={{ color: tema.textoMutado, fontSize: 13 }}>Admin tem acesso a todos os produtos automaticamente.</p>
              ) : (
                <>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
                    {produtos.map(p => (
                      <button
                        key={p.id}
                        onClick={() => toggleProduto(p.id)}
                        style={{
                          padding: "6px 16px", borderRadius: 20, border: "none",
                          cursor: "pointer", fontSize: 13, fontWeight: 600,
                          background: produtosUsuario.includes(p.id) ? p.cor : tema.inputBg,
                          color: produtosUsuario.includes(p.id) ? "white" : tema.textoSecundario,
                          outline: produtosUsuario.includes(p.id) ? `2px solid ${p.cor}` : `1px solid ${tema.inputBorder}`,
                        }}
                      >
                        <LogoProduto icone={p.icone} nome={p.nome} cor={p.cor} size="sm" />
                      </button>
                    ))}
                  </div>

                  <button onClick={salvarProdutos} disabled={salvando} style={btnPrimary}>
                    {salvando ? "Salvando..." : "💾 Salvar"}
                  </button>
                  {msg && <span style={{ marginLeft: 10, fontSize: 13, color: "#16A34A" }}>{msg}</span>}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const cardStyle = (tema) => ({ background: tema.cardBg, border: `1px solid ${tema.asideBorder}`, borderRadius: 16, padding: 20 });
const inputSt = (tema) => ({ padding: "8px 12px", border: `1px solid ${tema.inputBorder}`, borderRadius: 10, fontSize: 13, outline: "none", background: tema.inputBg, color: tema.textoPrimario, boxSizing: "border-box" });
const btnPrimary = { padding: "8px 20px", background: "#0A5C8E", color: "white", border: "none", borderRadius: 40, fontWeight: 600, cursor: "pointer", fontSize: 13 };
const btnOutline = (tema) => ({ padding: "8px 16px", background: "transparent", color: tema.textoSecundario, border: `1px solid ${tema.inputBorder}`, borderRadius: 40, cursor: "pointer", fontSize: 13 });