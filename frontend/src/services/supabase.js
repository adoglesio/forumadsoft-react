import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.warn("⚠️  VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY não configuradas (.env) — chat/notificações/online ficarão indisponíveis até configurar.");
}

// Cliente usado só para Realtime (chat, notificações, usuários online).
// Toda a leitura/escrita de dados continua passando pelo backend Express.
// Usamos um placeholder válido quando as env vars faltam para não derrubar
// o app inteiro no import — as chamadas de Realtime simplesmente falham
// silenciosamente até o .env ser configurado corretamente.
export const supabase = createClient(
  url || "https://placeholder.supabase.co",
  anonKey || "placeholder-anon-key"
);
