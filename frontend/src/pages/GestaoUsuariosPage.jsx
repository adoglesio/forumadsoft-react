import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import api, { listarProdutos, getProdutosUsuario, setProdutosUsuario, criarProduto, deletarProduto } from "../services/api";
import LogoProduto from "../components/LogoProduto";
import { IoTrashOutline, IoCubeOutline, IoPeopleOutline, IoLockClosedOutline, IoSaveOutline } from "react-icons/io5";

export default function GestaoUsuariosPage({ onVoltar }) {
  const { user } = useAuth();
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
    setMsg("Produtos salvos!");
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
    <div className="empty-state">
      <IoLockClosedOutline size={40} style={{ marginBottom: 8 }} />
      <p>Acesso restrito a administradores.</p>
      <button onClick={onVoltar} className="btn btn-primary">Voltar</button>
    </div>
  );

  return (
    <div className="app-narrow" style={{ maxWidth: 900 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <h2 style={{ margin: 0, color: "var(--text)", fontSize: 20, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
          <IoCubeOutline size={20} /> Gestão de produtos e usuários
        </h2>
      </div>

      <div className="grid-2">

        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ margin: "0 0 16px", color: "var(--text)", fontSize: 15, fontWeight: 700 }}>Produtos</h3>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
            {produtos.map(p => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--input-border)", background: "var(--input-bg)" }}>
                <LogoProduto icone={p.icone} nome={p.nome} cor={p.cor} size="md" />
                <button onClick={() => handleDeletarProduto(p.id)} className="btn-icon btn-ghost" style={{ border: "none", color: "var(--danger)" }} title="Excluir produto"><IoTrashOutline size={16} /></button>
              </div>
            ))}
            {produtos.length === 0 && <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Nenhum produto cadastrado.</p>}
          </div>

          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 14 }}>
            <p style={{ margin: "0 0 8px", fontWeight: 600, fontSize: 13, color: "var(--text)" }}>Novo produto</p>
            <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
              <input value={novoProduto} onChange={e => setNovoProduto(e.target.value)} placeholder="Nome do produto" className="input" style={{ flex: 1 }} />
              <input type="color" value={corNovo} onChange={e => setCorNovo(e.target.value)} style={{ width: 38, height: 38, border: "none", borderRadius: 8, cursor: "pointer", padding: 2, flexShrink: 0 }} title="Cor" />
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <input value={iconeNovo} onChange={e => setIconeNovo(e.target.value)} placeholder="Emoji" className="input" style={{ width: 70 }} maxLength={2} />
              <button onClick={handleCriarProduto} className="btn btn-primary btn-sm">Adicionar</button>
            </div>
          </div>
        </div>

        <div>
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ margin: "0 0 16px", color: "var(--text)", fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
              <IoPeopleOutline size={17} /> Usuários
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 280, overflowY: "auto" }}>
              {usuarios.map(u => (
                <div
                  key={u.email}
                  onClick={() => selecionarUsuario(u)}
                  style={{
                    padding: "10px 14px", borderRadius: "var(--radius-sm)", cursor: "pointer",
                    border: selecionado?.email === u.email ? "2px solid var(--primary)" : "1px solid var(--input-border)",
                    background: selecionado?.email === u.email ? "var(--primary-soft)" : "var(--input-bg)",
                    display: "flex", alignItems: "center", gap: 10,
                  }}
                >
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--primary)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, flexShrink: 0, fontSize: 13 }}>
                    {u.nome?.charAt(0)?.toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.nome}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email}</div>
                  </div>
                  {u.isAdmin && <span className="badge" style={{ marginLeft: "auto", background: "#F6C64B", color: "#4A3300", flexShrink: 0 }}>Admin</span>}
                </div>
              ))}
            </div>
          </div>

          {selecionado && (
            <div className="card" style={{ padding: 20, marginTop: 16 }}>
              <p style={{ margin: "0 0 12px", fontWeight: 700, fontSize: 14, color: "var(--text)" }}>
                Produtos de <span style={{ color: "var(--primary)" }}>{selecionado.nome}</span>
              </p>

              {selecionado.isAdmin ? (
                <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Admin tem acesso a todos os produtos automaticamente.</p>
              ) : (
                <>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
                    {produtos.map(p => (
                      <button
                        key={p.id}
                        onClick={() => toggleProduto(p.id)}
                        className={`chip ${produtosUsuario.includes(p.id) ? "chip-active" : ""}`}
                        style={{ background: produtosUsuario.includes(p.id) ? p.cor : undefined, color: produtosUsuario.includes(p.id) ? "white" : undefined }}
                      >
                        <LogoProduto icone={p.icone} nome={p.nome} cor={p.cor} size="sm" />
                      </button>
                    ))}
                  </div>

                  <button onClick={salvarProdutos} disabled={salvando} className="btn btn-primary btn-sm">
                    <IoSaveOutline size={14} /> {salvando ? "Salvando..." : "Salvar"}
                  </button>
                  {msg && <span className="form-message form-message-success" style={{ display: "inline-flex", marginLeft: 10 }}>{msg}</span>}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

