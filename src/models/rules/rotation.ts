// Rotação do Solador na notação da comunidade:
//   1–6 = habilidades na ordem da tela (6 = Ultimate / Despertada / Tier-4)
//   c = cancelar logo após usar · dc = cancelar com atraso · qc = cancelamento rápido
//   ( ) = trecho opcional / "recheio" antes do bônus principal
// Ex.: "1 2c (3dc 4) 6". Separadores aceitos entre os passos: espaço, vírgula, ">", "→", "-".

export const CANCELS = ["c", "dc", "qc"] as const;
export type Cancel = (typeof CANCELS)[number];

export const ULTIMATE_SKILL = 6;
export const MAX_ROTATION_STEPS = 30;

export interface RotationStep {
  skill: number;
  cancel: Cancel | null;
}

/** Um passo, ou um grupo opcional (entre parênteses). */
export type RotationPart = RotationStep | RotationStep[];

export type RotationError = "empty" | "token" | "unclosedGroup" | "unopenedGroup" | "nestedGroup" | "emptyGroup" | "tooLong";

export type RotationParse = { ok: true; parts: RotationPart[] } | { ok: false; error: RotationError; token?: string };

const STEP = /^([1-6])(dc|qc|c)?$/;

export function parseRotation(input: string): RotationParse {
  const tokens = input
    .toLowerCase()
    .replace(/[,>→–—-]/g, " ")
    .replace(/([()])/g, " $1 ")
    .split(/\s+/)
    .filter(Boolean);
  if (tokens.length === 0) return { ok: false, error: "empty" };

  const parts: RotationPart[] = [];
  let group: RotationStep[] | null = null;
  let count = 0;
  for (const token of tokens) {
    if (token === "(") {
      if (group) return { ok: false, error: "nestedGroup" };
      group = [];
      continue;
    }
    if (token === ")") {
      if (!group) return { ok: false, error: "unopenedGroup" };
      if (group.length === 0) return { ok: false, error: "emptyGroup" };
      parts.push(group);
      group = null;
      continue;
    }
    const m = STEP.exec(token);
    if (!m) return { ok: false, error: "token", token };
    if (++count > MAX_ROTATION_STEPS) return { ok: false, error: "tooLong" };
    const step: RotationStep = { skill: Number(m[1]), cancel: (m[2] as Cancel | undefined) ?? null };
    if (group) group.push(step);
    else parts.push(step);
  }
  if (group) return { ok: false, error: "unclosedGroup" };
  return { ok: true, parts };
}

const formatStep = (s: RotationStep) => `${s.skill}${s.cancel ?? ""}`;

/** Forma canônica (a que fica salva): passos separados por espaço, grupos como "(3dc 4)". */
export function formatRotation(parts: RotationPart[]): string {
  return parts.map((p) => (Array.isArray(p) ? `(${p.map(formatStep).join(" ")})` : formatStep(p))).join(" ");
}

/** Normaliza o texto digitado; null se estiver vazio ou inválido. */
export function normalizeRotation(input: string | null | undefined): string | null {
  if (!input?.trim()) return null;
  const parsed = parseRotation(input);
  return parsed.ok ? formatRotation(parsed.parts) : null;
}
