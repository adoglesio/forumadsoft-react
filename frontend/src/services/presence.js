import { supabase } from "./supabase";

// ─────────────────────────────────────────────────────────────────────────
// "Quem está online" via Supabase Realtime Presence — substitui o antigo
// ping em /api/usuarios/ping + polling de /api/usuarios/online.
// Um único canal é compartilhado por todo o app (Header, sidebar de
// usuários online etc. assinam através de ouvirOnline()).
// ─────────────────────────────────────────────────────────────────────────

let canal = null;
let estado = {};
const ouvintes = new Set();

function listaAtual() {
  return Object.values(estado).flat();
}

function emitir() {
  const lista = listaAtual();
  ouvintes.forEach((fn) => fn(lista));
}

export function iniciarPresence(user) {
  if (canal || !user?.email) return;

  canal = supabase.channel("forum-presence", {
    config: { presence: { key: user.email } },
  });

  canal
    .on("presence", { event: "sync" }, () => {
      estado = canal.presenceState();
      emitir();
    })
    .subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await canal.track({ email: user.email, nome: user.nome, avatar: user.avatar || null });
      }
    });
}

export function pararPresence() {
  if (canal) {
    supabase.removeChannel(canal);
    canal = null;
    estado = {};
    emitir();
  }
}

// Chame dentro de um useEffect; retorna a função de cleanup.
export function ouvirOnline(callback) {
  ouvintes.add(callback);
  callback(listaAtual());
  return () => ouvintes.delete(callback);
}
