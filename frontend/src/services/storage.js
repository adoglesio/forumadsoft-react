import { supabase } from "./supabase";

// Envia o PDF direto pro Supabase Storage (não passa pelo backend,
// então não esbarra no limite de tamanho de requisição da Vercel).
export async function uploadProcedimentoPDF(file) {
  const nomeArquivo = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;

  const { error } = await supabase.storage
    .from("procedimentos-pdfs")
    .upload(nomeArquivo, file, { contentType: "application/pdf" });

  if (error) throw error;

  const { data } = supabase.storage.from("procedimentos-pdfs").getPublicUrl(nomeArquivo);
  return { url: data.publicUrl, nome: file.name };
}

// Remove o arquivo do Storage (usado ao excluir um procedimento)
export async function removerProcedimentoPDF(url) {
  try {
    const nomeArquivo = url.split("/procedimentos-pdfs/")[1];
    if (nomeArquivo) await supabase.storage.from("procedimentos-pdfs").remove([nomeArquivo]);
  } catch {
    // se falhar, não é crítico — o registro já foi apagado do banco
  }
}
