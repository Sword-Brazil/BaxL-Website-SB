// Rotação do Solador na notação da comunidade:
//   1–7 = habilidades na ordem da tela (7 = Ultimate / Despertada / Tier-4)
//   c = cancelar logo após usar · dc = cancelar com atraso · qc = cancelamento rápido
//   ( ) = trecho opcional / "recheio" antes do bônus principal
//   | = fim da rotação atual · / = começa a próxima rotação · * = recomeça do início (loop)
// Ex.: "1 2c (3dc 4) 7 | 5 6 *". Separadores aceitos entre os passos: espaço, vírgula, ">", "→", "-".

export const CANCELS = ["c", "dc", "qc"] as const;
export type Cancel = (typeof CANCELS)[number];

/** Marcadores que viram ícones: fim da rotação, próxima rotação e recomeço. */
export const MARKERS = { "|": "end", "/": "next", "*": "restart" } as const;
export type Marker = (typeof MARKERS)[keyof typeof MARKERS];

export const ULTIMATE_SKILL = 7;
export const MAX_ROTATION_STEPS = 30;

export interface RotationStep {
  skill: number;
  cancel: Cancel | null;
}

export interface RotationMarker {
  marker: Marker;
}

/** Um passo, um grupo opcional (entre parênteses) ou um marcador. */
export type RotationPart = RotationStep | RotationStep[] | RotationMarker;

/** Trecho que não segue a notação (só aparece no resultado parcial de um texto com erro). */
export interface RotationUnknown {
  unknown: string;
}

export type RotationError =
  | "empty"
  | "token"
  | "unclosedGroup"
  | "unopenedGroup"
  | "nestedGroup"
  | "emptyGroup"
  | "markerInGroup"
  | "tooLong";

/**
 * Com erro, `parts` traz tudo o que deu para ler (e os trechos desconhecidos no lugar), para a
 * prévia mostrar os blocos até onde der; `error`/`token` é o primeiro problema encontrado.
 */
export type RotationParse =
  | { ok: true; parts: RotationPart[] }
  | { ok: false; error: RotationError; token?: string; parts: (RotationPart | RotationUnknown)[] };

const STEP = /^([1-7])(dc|qc|c)?$/;

export const isMarker = (p: RotationPart | RotationUnknown): p is RotationMarker => "marker" in p;
export const isUnknown = (p: RotationPart | RotationUnknown): p is RotationUnknown => "unknown" in p;

export function parseRotation(input: string): RotationParse {
  const tokens = input
    .toLowerCase()
    .replace(/[,>→–—-]/g, " ")
    .replace(/([()|/*])/g, " $1 ")
    .split(/\s+/)
    .filter(Boolean);
  if (tokens.length === 0) return { ok: false, error: "empty", parts: [] };

  const parts: (RotationPart | RotationUnknown)[] = [];
  let group: RotationStep[] | null = null;
  let count = 0;
  const problems: { error: RotationError; token?: string }[] = [];
  const fail = (error: RotationError, token?: string) => problems.push(token === undefined ? { error } : { error, token });

  for (const token of tokens) {
    if (token === "(") {
      if (group) fail("nestedGroup");
      else group = [];
      continue;
    }
    if (token === ")") {
      if (!group) fail("unopenedGroup");
      else if (group.length === 0) fail("emptyGroup");
      else parts.push(group);
      group = null;
      continue;
    }
    const marker = MARKERS[token as keyof typeof MARKERS];
    if (marker) {
      if (group) fail("markerInGroup");
      else parts.push({ marker });
      continue;
    }
    const m = STEP.exec(token);
    if (!m) {
      fail("token", token);
      if (!group) parts.push({ unknown: token });
      continue;
    }
    if (++count > MAX_ROTATION_STEPS) {
      fail("tooLong");
      break;
    }
    const step: RotationStep = { skill: Number(m[1]), cancel: (m[2] as Cancel | undefined) ?? null };
    if (group) group.push(step);
    else parts.push(step);
  }
  if (group) {
    fail("unclosedGroup");
    if (group.length) parts.push(group);
  }
  return problems.length ? { ok: false, ...problems[0], parts } : { ok: true, parts: parts as RotationPart[] };
}

const formatStep = (s: RotationStep) => `${s.skill}${s.cancel ?? ""}`;
const MARKER_CHAR = Object.fromEntries(Object.entries(MARKERS).map(([c, m]) => [m, c])) as Record<Marker, string>;

/** Forma canônica (a que fica salva): passos separados por espaço, grupos como "(3dc 4)". */
export function formatRotation(parts: RotationPart[]): string {
  return parts
    .map((p) => (Array.isArray(p) ? `(${p.map(formatStep).join(" ")})` : "marker" in p ? MARKER_CHAR[p.marker] : formatStep(p)))
    .join(" ");
}

/** Normaliza o texto digitado; null se estiver vazio ou inválido. */
export function normalizeRotation(input: string | null | undefined): string | null {
  if (!input?.trim()) return null;
  const parsed = parseRotation(input);
  return parsed.ok ? formatRotation(parsed.parts) : null;
}
