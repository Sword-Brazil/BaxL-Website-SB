// Exportação das estatísticas de personagens (Metas ou equipes do jogador) num documento HTML:
// foto, CTPs usados (ícones com a cor do CTP) e os dias em que cada personagem aparece, do mais
// usado para o menos. Função pura: os textos já chegam traduzidos e tudo é escapado.
import type { Mode } from "@/models/domain/enums";
import { escapeHtml } from "./teamsExport";

export interface StatsExportCtp {
  label: string;
  /** URL absoluta do ícone (opcional). */
  image: string | null;
  color: string;
  count: number;
}

export interface StatsExportRow {
  name: string;
  /** URL absoluta da foto (opcional). */
  portrait: string | null;
  total: number;
  /** Aparições por semana (S1–S4). */
  weeks: number[];
  ctps: StatsExportCtp[];
  /** Dias em que aparece, na ordem do ciclo, com o nome do CTP usado no dia. */
  days: { mode: Mode; day: number; ctp: string | null }[];
}

export interface StatsExportLabels {
  rank: string;
  agent: string;
  ctps: string;
  total: string;
  days: string;
  weeks: string[];
  dayShort: (day: number) => string;
  noCtp: string;
  empty: string;
  generatedAt: string;
}

const MODE_COLOR: Record<Mode, string> = { BAX: "#2f6fd6", BAL: "#e07a1f", BAI: "#d23a3a" };

function ctpChip(c: StatsExportCtp): string {
  const icon = c.image
    ? `<img src="${escapeHtml(c.image)}" alt="" width="24" height="24" loading="lazy">`
    : `<i aria-hidden="true"></i>`;
  return `<span class="ctp" style="--ctp:${escapeHtml(c.color)}" title="${escapeHtml(c.label)}">${icon}<span>${escapeHtml(c.label)}</span><b>×${c.count}</b></span>`;
}

function row(r: StatsExportRow, i: number, labels: StatsExportLabels): string {
  const img = r.portrait ? `<img src="${escapeHtml(r.portrait)}" alt="" width="40" height="40" loading="lazy">` : "";
  const ctps = r.ctps.length ? r.ctps.map(ctpChip).join("") : `<span class="muted">${escapeHtml(labels.noCtp)}</span>`;
  const days = r.days
    .map(
      (d) =>
        `<span class="day" style="--mode:${MODE_COLOR[d.mode]}"${d.ctp ? ` title="${escapeHtml(d.ctp)}"` : ""}>${d.mode} · ${escapeHtml(labels.dayShort(d.day))}</span>`,
    )
    .join("");
  const weeks = r.weeks.map((w) => `<td class="num">${w}</td>`).join("");
  return `<tr><td class="num rank">${i + 1}</td><td class="agent">${img}<strong>${escapeHtml(r.name)}</strong></td><td class="ctps">${ctps}</td>${weeks}<td class="num total">${r.total}</td><td class="days">${days}</td></tr>`;
}

export function renderStatsHtml(
  rows: StatsExportRow[],
  labels: StatsExportLabels,
  meta: { title: string; subtitle: string; lang: string },
): string {
  const head = [labels.rank, labels.agent, labels.ctps, ...labels.weeks, labels.total, labels.days]
    .map((h) => `<th scope="col">${escapeHtml(h)}</th>`)
    .join("");
  const body = rows.length
    ? rows.map((r, i) => row(r, i, labels)).join("\n")
    : `<tr><td colspan="${5 + labels.weeks.length}" class="muted">${escapeHtml(labels.empty)}</td></tr>`;
  return `<!doctype html>
<html lang="${escapeHtml(meta.lang)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(meta.title)}</title>
<style>
  :root { color-scheme: light; --ink: #14202b; --muted: #5b6b7a; --line: #d9e1e8; --bg: #f5f8fb; }
  body { margin: 0; padding: 24px 16px; font: 14px/1.4 system-ui, -apple-system, "Segoe UI", sans-serif; color: var(--ink); background: var(--bg); }
  h1 { margin: 0 0 4px; font-size: 22px; }
  p.sub { margin: 0 0 16px; color: var(--muted); }
  .wrap { overflow-x: auto; background: #fff; border: 1px solid var(--line); border-radius: 10px; }
  table { border-collapse: collapse; width: 100%; min-width: 900px; }
  th, td { border-bottom: 1px solid var(--line); padding: 8px; text-align: left; vertical-align: middle; }
  thead th { position: sticky; top: 0; background: #eef3f7; font-size: 12px; text-transform: uppercase; letter-spacing: .06em; color: var(--muted); }
  td.num { text-align: right; font-variant-numeric: tabular-nums; width: 36px; }
  td.rank { color: var(--muted); }
  td.total { font-weight: 700; font-size: 16px; }
  td.agent { min-width: 170px; white-space: nowrap; }
  td.agent img { width: 40px; height: 40px; object-fit: cover; border-radius: 6px; vertical-align: middle; margin-right: 8px; background: #e3e9ee; }
  td.ctps { min-width: 200px; }
  .ctp { display: inline-flex; align-items: center; gap: 4px; margin: 2px 6px 2px 0; padding: 2px 8px 2px 2px; border-radius: 999px; background: color-mix(in srgb, var(--ctp) 12%, #fff); font-size: 12px; }
  .ctp img, .ctp i { width: 24px; height: 24px; border-radius: 50%; box-shadow: 0 0 0 2px var(--ctp); background: #fff; object-fit: contain; display: inline-block; }
  .ctp b { color: var(--muted); font-weight: 600; }
  td.days { min-width: 260px; }
  .day { display: inline-block; margin: 2px 4px 2px 0; padding: 1px 7px; border-radius: 6px; border: 1px solid var(--mode); color: var(--mode); font-size: 12px; font-weight: 600; white-space: nowrap; }
  .muted { color: #9aa8b5; font-style: italic; }
  footer { margin-top: 12px; color: var(--muted); font-size: 12px; }
  @media print { body { background: #fff; padding: 0; } .wrap { border: 0; overflow: visible; } thead th { position: static; } tr { break-inside: avoid; } }
</style>
</head>
<body>
<h1>${escapeHtml(meta.title)}</h1>
<p class="sub">${escapeHtml(meta.subtitle)}</p>
<div class="wrap">
<table>
<thead><tr>${head}</tr></thead>
<tbody>
${body}
</tbody>
</table>
</div>
<footer>${escapeHtml(labels.generatedAt)}</footer>
</body>
</html>
`;
}
