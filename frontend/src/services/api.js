import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const mensagem = error.response?.data?.error || "Erro ao comunicar com o servidor.";
    return Promise.reject(new Error(mensagem));
  }
);

export default api;

// ─── ERROS ───────────────────────────────────────────────
export const listarErros = (filtro = "", produto_id = "", usuario_email = "") =>
  api.get("/erros", {
    params: {
      ...(filtro ? { filtro } : {}),
      ...(produto_id ? { produto_id: String(produto_id) } : {}),
      ...(usuario_email ? { usuario_email } : {}),
    },
  }).then((r) => r.data.data);

export const buscarErro = (id) =>
  api.get(`/erros/${id}`).then((r) => r.data.data);

export const criarErro = (dados) =>
  api.post("/erros", dados).then((r) => r.data.data);

export const editarErro = (id, dados) =>
  api.put(`/erros/${id}`, dados).then((r) => r.data.success);

export const excluirErro = (id, usuario_email) =>
  api.delete(`/erros/${id}`, { data: { usuario_email } }).then((r) => r.data.success);

// ─── COMENTÁRIOS ─────────────────────────────────────────
export const adicionarComentario = (erroId, dados) =>
  api.post(`/erros/${erroId}/comentarios`, dados).then((r) => r.data.data);

export const editarComentario = (erroId, comentarioId, dados) =>
  api.put(`/erros/${erroId}/comentarios/${comentarioId}`, dados).then((r) => r.data.success);

export const excluirComentario = (erroId, comentarioId, usuario_email) =>
  api.delete(`/erros/${erroId}/comentarios/${comentarioId}`, { data: { usuario_email } })
    .then((r) => r.data.success);

// ─── USUÁRIOS ────────────────────────────────────────────
export const atualizarPerfil = (dados) =>
  api.put("/usuarios/perfil", dados).then((r) => r.data.data);

export const alterarSenha = (dados) =>
  api.put("/usuarios/senha", dados).then((r) => r.data.success);

// ─── ESTATÍSTICAS ─────────────────────────────────────────
export const carregarEstatisticas = () =>
  api.get("/estatisticas").then((r) => r.data.data);

// ─── USUÁRIOS ONLINE ──────────────────────────────────────
export const enviarPing = (dados) =>
  api.post("/usuarios/ping", dados).then((r) => r.data.success);

export const listarOnline = () =>
  api.get("/usuarios/online").then((r) => r.data.data);

export const fazerLogout = (email) =>
  api.post("/usuarios/logout", { email }).then((r) => r.data.success);

// ─── REAÇÕES ──────────────────────────────────────────────
export const buscarReacoes = (erroId, usuario_email) =>
  api.get(`/reacoes/${erroId}`, { params: { usuario_email } }).then((r) => r.data.data);

export const reagir = (erroId, usuario_email, tipo) =>
  api.post(`/reacoes/${erroId}`, { usuario_email, tipo }).then((r) => r.data.data);

// ─── PRODUTOS ─────────────────────────────────────────────
export const listarProdutos = () =>
  api.get("/produtos").then((r) => r.data.data);

export const criarProduto = (dados) =>
  api.post("/produtos", dados).then((r) => r.data.data);

export const deletarProduto = (id, usuario_email) =>
  api.delete(`/produtos/${id}`, { data: { usuario_email } }).then((r) => r.data.success);

export const getProdutosUsuario = (email) =>
  api.get(`/produtos/usuario/${encodeURIComponent(email)}`).then((r) => r.data.data);

export const setProdutosUsuario = (email, produto_ids, usuario_email) =>
  api.put(`/produtos/usuario/${encodeURIComponent(email)}`, { produto_ids, usuario_email })
    .then((r) => r.data.success);
