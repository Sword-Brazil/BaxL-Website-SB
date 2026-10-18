// Baixa uma vez as imagens listadas em scripts/assets-manifest.json para public/assets/.
// Uso: npm run assets:import [-- --force]
// - Espera 500 ms entre downloads (não sobrecarrega o site de origem).
// - Não sobrescreve arquivos existentes sem --force.
// - Recusa rodar com NODE_ENV=production.
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

interface ManifestItem {
  url: string;
  dest: string;
}

const ROOT = path.join(process.cwd(), "public", "assets");
const DELAY_MS = 500;
const ALLOWED = new Set(["image/png", "image/webp", "image/jpeg"]);

async function main() {
  if (process.env.NODE_ENV === "production") {
    console.error("✖ import-assets não roda em produção.");
    process.exit(1);
  }
  const force = process.argv.includes("--force");
  const manifest = JSON.parse(await readFile("scripts/assets-manifest.json", "utf8")) as { items: ManifestItem[] };

  let ok = 0;
  let skipped = 0;
  let failed = 0;
  for (const item of manifest.items) {
    const dest = path.normalize(path.join(ROOT, item.dest));
    if (!dest.startsWith(ROOT + path.sep)) {
      console.error(`✖ destino fora de public/assets: ${item.dest}`);
      failed++;
      continue;
    }
    if (existsSync(dest) && !force) {
      skipped++;
      continue;
    }
    try {
      const res = await fetch(item.url, { headers: { "User-Agent": "mff-system-asset-import (Sword Brazil fan project)" } });
      const type = res.headers.get("content-type")?.split(";")[0] ?? "";
      if (!res.ok || !ALLOWED.has(type)) throw new Error(`HTTP ${res.status} ${type}`);
      await mkdir(path.dirname(dest), { recursive: true });
      await writeFile(dest, Buffer.from(await res.arrayBuffer()));
      console.log(`✔ ${item.dest}`);
      ok++;
    } catch (e) {
      console.error(`✖ ${item.url}: ${(e as Error).message}`);
      failed++;
    }
    await new Promise((r) => setTimeout(r, DELAY_MS));
  }
  console.log(`\n${ok} baixadas, ${skipped} já existiam, ${failed} falharam.`);
  if (failed) process.exitCode = 1;
}

main();
