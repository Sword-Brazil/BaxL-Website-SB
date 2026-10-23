import { readFile } from "node:fs/promises";
import path from "node:path";
import { HttpError } from "@/server/http";

// Guia da Administração (página Sobre): textos e prints ficam em private/guide, fora de public/
// e das traduções públicas, e só saem pelas rotas de admin. Membros não veem como o admin é.
const DIR = path.join(process.cwd(), "private", "guide");
const LOCALES = ["pt-BR", "en", "es"] as const;
const IMAGE = /^admin-(desktop|mobile)-(dark|light)\.jpg$/;

export interface ShotMarker {
  n: number;
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface GuideShot {
  width: number;
  height: number;
  markers: ShotMarker[];
}
export interface AdminGuide {
  title: string;
  intro: string;
  markers: Record<string, string>;
  tips: Record<string, string>;
  /** Item "Minha conta" da barra do topo na versão de quem é admin. */
  header8: string;
  shots: { desktop: GuideShot; mobile: GuideShot };
}

export async function getAdminGuide(locale: string): Promise<AdminGuide> {
  const data = JSON.parse(await readFile(path.join(DIR, "admin.json"), "utf8"));
  const lang = (LOCALES as readonly string[]).includes(locale) ? locale : "pt-BR";
  return { ...data.texts[lang], shots: data.shots };
}

/** Print do guia da Administração; só os nomes conhecidos (nada de caminhos arbitrários). */
export async function readAdminGuideImage(name: string): Promise<Buffer> {
  if (!IMAGE.test(name)) throw new HttpError(404, "NOT_FOUND", "Imagem não encontrada");
  return readFile(path.join(DIR, name));
}
