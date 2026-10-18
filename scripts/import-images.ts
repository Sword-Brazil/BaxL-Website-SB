// Copia as imagens de img/ (retratos, CTPs e ícones de restrição) para public/assets e liga cada
// retrato ao traje no banco, conforme prisma/data/images.json. Uso: npm run import:images
// Idempotente: pode rodar de novo depois de adicionar fotos (mantém as já ligadas).
import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const prisma = new PrismaClient();

interface Manifest {
  chars: { file: string; agent: string; uniform: string | null }[];
  ctps: Record<string, string>;
  restrictions: string[];
}

const copy = (from: string, toDir: string, name = path.basename(from)) => {
  mkdirSync(toDir, { recursive: true });
  copyFileSync(from, path.join(toDir, name));
  return name;
};

async function main() {
  const m = JSON.parse(readFileSync("prisma/data/images.json", "utf8")) as Manifest;
  const problems: string[] = [];

  // Limpa só as fotos ligadas por este script (public/assets/agents), preservando envios do admin,
  // para que correções no manifesto (troca de foto/traje) não deixem fotos antigas para trás.
  await prisma.uniform.updateMany({ where: { imagePath: { startsWith: "/assets/agents/" } }, data: { imagePath: "" } });

  // Retratos: um por traje; "uniform: null" vira o retrato padrão do personagem (traje Padrão sem foto).
  let linked = 0;
  for (const c of m.chars) {
    const src = path.join("img", "Chars", c.file);
    const agent = await prisma.agent.findFirst({ where: { name: c.agent }, include: { uniforms: true } });
    if (!existsSync(src) || !agent) {
      problems.push(`${c.file}: ${!agent ? `agente "${c.agent}" não encontrado` : "arquivo ausente"}`);
      continue;
    }
    const name = copy(src, path.join("public", "assets", "agents", agent.slug), c.file.toLowerCase());
    const imagePath = `/assets/agents/${agent.slug}/${name}`;
    const target = c.uniform
      ? agent.uniforms.find((u) => u.name === c.uniform)
      : agent.uniforms.find((u) => u.slug === "padrao" && !u.imagePath);
    if (c.uniform && !target) {
      problems.push(`${c.file}: traje "${c.uniform}" de ${c.agent} não encontrado`);
      continue;
    }
    if (target) {
      await prisma.uniform.update({ where: { id: target.id }, data: { imagePath } });
      linked++;
    }
  }
  console.log(`✔ ${linked} trajes com retrato`);

  // CTPs: a mesma imagem para as 3 qualidades do tipo (a qualidade é indicada pela cor do anel).
  for (const [type, file] of Object.entries(m.ctps)) {
    const src = path.join("img", "CTPs", file);
    if (!existsSync(src)) {
      problems.push(`CTP ${type}: ${file} ausente`);
      continue;
    }
    const name = copy(src, path.join("public", "assets", "ctp"), `${type.toLowerCase()}${path.extname(file)}`);
    await prisma.ctp.updateMany({ where: { type }, data: { imagePath: `/assets/ctp/${name}` } });
  }
  console.log(`✔ ${Object.keys(m.ctps).length} tipos de CTP com imagem`);

  // Ícones de restrição (usados nos selos de restrição).
  for (const r of m.restrictions) {
    const src = path.join("img", "restrictions", `${r}.webp`);
    if (existsSync(src)) copy(src, path.join("public", "assets", "restrictions"));
    else problems.push(`restrição ${r}: ícone ausente`);
  }
  console.log(`✔ ícones de restrição`);

  if (problems.length) console.warn(`\n⚠ ${problems.length} pendência(s):\n- ${problems.join("\n- ")}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
