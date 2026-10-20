// Mensagens agora persistem no Postgres (tabela `chat`). A entrega em tempo
// real para os outros usuários é feita pelo Supabase Realtime, direto do
// frontend — não precisamos mais fazer broadcast por SSE aqui.
