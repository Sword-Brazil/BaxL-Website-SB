import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Onde ficam as imagens enviadas pela curadoria. Com SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY,
 * vão para o Supabase Storage (bucket público, padrão "assets"); sem elas, em
 * public/assets/uploads (desenvolvimento local). Na Vercel o disco é efêmero: lá o Storage é
 * obrigatório.
 */
export interface StorageConfig {
  url: string;
  key: string;
  bucket: string;
}

export function storageConfig(): StorageConfig | null {
  const url = process.env.SUPABASE_URL?.replace(/\/+$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return { url, key, bucket: process.env.SUPABASE_STORAGE_BUCKET || "assets" };
}

const authHeaders = (c: StorageConfig) => ({ Authorization: `Bearer ${c.key}`, apikey: c.key });

export const publicUrl = (c: StorageConfig, objectPath: string) => `${c.url}/storage/v1/object/public/${c.bucket}/${objectPath}`;

/** Cria o bucket público, se ainda não existir (usado pelo script de migração). */
export async function ensureBucket(c: StorageConfig): Promise<void> {
  const found = await fetch(`${c.url}/storage/v1/bucket/${c.bucket}`, { headers: authHeaders(c) });
  if (found.ok) return;
  const res = await fetch(`${c.url}/storage/v1/bucket`, {
    method: "POST",
    headers: { ...authHeaders(c), "Content-Type": "application/json" },
    body: JSON.stringify({ id: c.bucket, name: c.bucket, public: true, file_size_limit: 2 * 1024 * 1024 }),
  });
  if (!res.ok) throw new Error(`Não foi possível criar o bucket "${c.bucket}": ${res.status} ${await res.text()}`);
}

/** Salva `data` em `uploads/<fileName>` e devolve o caminho/URL público da imagem. */
export async function putUpload(fileName: string, data: Buffer, contentType: string): Promise<string> {
  const config = storageConfig();
  const objectPath = `uploads/${fileName}`;
  if (config) {
    const res = await fetch(`${config.url}/storage/v1/object/${config.bucket}/${objectPath}`, {
      method: "POST",
      headers: { ...authHeaders(config), "Content-Type": contentType, "x-upsert": "true", "Cache-Control": "max-age=31536000" },
      body: new Uint8Array(data),
    });
    if (!res.ok) throw new Error(`Falha ao enviar a imagem ao Supabase Storage: ${res.status} ${await res.text()}`);
    return publicUrl(config, objectPath);
  }
  if (process.env.VERCEL) {
    throw new Error("Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY: na Vercel as imagens precisam ir para o Supabase Storage.");
  }
  const dir = path.join(process.cwd(), "public", "assets", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, fileName), data);
  return `/assets/${objectPath}`;
}
