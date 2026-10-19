// Exportação das equipes do ciclo (Meta, Alternativas e as do jogador) num documento HTML com
// uma tabela, que abre em qualquer navegador e imprime bem. Função pura: os textos já chegam
// traduzidos e tudo é escapado.
import { DISPLAY_SLOTS, type Mode, type Slot } from "@/models/domain/enums";

export interface ExportMember {
  name: string;
  uniform: string | null;
  ctp: string | null;
  damageDealer: boolean;
  /** URL absoluta da foto (opcional). */
  portrait: string | null;
}

export interface ExportTeam {
  kind: "META" | "ALT" | "MINE";
  label: string;
  members: Partial<Record<Slot, ExportMember>>;
}

/** Um modo de um dia (ou a BAI) com as equipes dele. */
export interface ExportBlock {
  day: number;
  weekday: string;
  mode: Mode;
  restriction: string;
  teams: ExportTeam[];
}

export interface ExportLabels {
  day: string;
  mode: string;
  restriction: string;
  team: string;
  slots: Record<Slot, string>;
  damageDealer: string;
  empty: string;
  noTeams: string;
  generatedAt: string;
}

const MODE_COLOR: Record<Mode, string> = { BAX: "#2f6fd6", BAL: "#e07a1f", BAI: "#d23a3a" };

export const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

function memberCell(m: ExportMember | undefined, labels: ExportLabels): string {
  if (!m) return `<td class="member empty">${escapeHtml(labels.empty)}</td>`;
  const img = m.portrait ? `<img src="${escapeHtml(m.portrait)}" alt="" width="36" height="36" loading="lazy">` : "";
  const dd = m.damageDealer ? ` <span class="dd" title="${escapeHtml(labels.damageDealer)}">⚔</span>` : "";
  const uniform = m.uniform ? `<small>${escapeHtml(m.uniform)}</small>` : "";
  const ctp = m.ctp ? `<small class="ctp">${escapeHtml(m.ctp)}</small>` : "";
  return `<td class="member">${img}<span><strong>${escapeHtml(m.name)}${dd}</strong>${uniform}${ctp}</span></td>`;
}

/** Linhas da tabela: dia e modo agrupados (rowspan), uma linha por equipe. */
function bodyRows(blocks: ExportBlock[], labels: ExportLabels): string {
  const rows: string[] = [];
  const byDay = new Map<number, ExportBlock[]>();
  for (const b of blocks) byDay.set(b.day, [...(byDay.get(b.day) ?? []), b]);
  for (const [day, dayBlocks] of byDay) {
    const span = (b: ExportBlock) => Math.max(b.teams.length, 1);
    const daySpan = dayBlocks.reduce((n, b) => n + span(b), 0);
    dayBlocks.forEach((b, bi) => {
      const teams: (ExportTeam | null)[] = b.teams.length ? b.teams : [null];
      teams.forEach((team, ti) => {
        const cells: string[] = [];
        if (bi === 0 && ti === 0) {
          cells.push(`<th scope="rowgroup" rowspan="${daySpan}" class="day">${day}<small>${escapeHtml(dayBlocks[0].weekday)}</small></th>`);
        }
        if (ti === 0) {
          cells.push(
            `<td rowspan="${span(b)}" class="mode" style="--mode:${MODE_COLOR[b.mode]}"><span>${b.mode}</span></td>`,
            `<td rowspan="${span(b)}" class="restriction">${escapeHtml(b.restriction)}</td>`,
          );
        }
        if (!team) {
          cells.push(`<td colspan="${1 + DISPLAY_SLOTS.length}" class="empty">${escapeHtml(labels.noTeams)}</td>`);
        } else {
          cells.push(`<td class="team ${team.kind.toLowerCase()}">${escapeHtml(team.label)}</td>`);
          for (const slot of DISPLAY_SLOTS) cells.push(memberCell(team.members[slot], labels));
        }
        rows.push(`<tr class="mode-${b.mode.toLowerCase()}${bi === 0 && ti === 0 ? " day-start" : ""}">${cells.join("")}</tr>`);
      });
    });
  }
  return rows.join("\n");
}

export function renderTeamsHtml(
  blocks: ExportBlock[],
  labels: ExportLabels,
  meta: { title: string; subtitle: string; lang: string },
): string {
  const head = [labels.day, labels.mode, labels.restriction, labels.team, ...DISPLAY_SLOTS.map((s) => labels.slots[s])]
    .map((h) => `<th scope="col">${escapeHtml(h)}</th>`)
    .join("");
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
  table { border-collapse: collapse; width: 100%; min-width: 860px; }
  th, td { border-bottom: 1px solid var(--line); padding: 8px; text-align: left; vertical-align: middle; }
  thead th { position: sticky; top: 0; background: #eef3f7; font-size: 12px; text-transform: uppercase; letter-spacing: .06em; color: var(--muted); }
  tr.day-start > * { border-top: 2px solid #b9c6d2; }
  th.day { font-size: 22px; text-align: center; width: 56px; }
  th.day small { display: block; font-size: 11px; color: var(--muted); font-weight: 600; }
  td.mode { width: 52px; border-left: 4px solid var(--mode); }
  td.mode span { color: var(--mode); font-weight: 700; letter-spacing: .05em; }
  td.restriction { color: var(--muted); width: 150px; }
  td.team { font-weight: 600; white-space: nowrap; }
  td.team.meta { color: #0f7f95; } td.team.mine { color: #1f8a4c; } td.team.alt { color: var(--muted); }
  td.member { min-width: 150px; }
  td.member img { width: 36px; height: 36px; object-fit: cover; border-radius: 6px; float: left; margin-right: 8px; background: #e3e9ee; }
  td.member strong { display: block; }
  td.member small { display: block; color: var(--muted); font-size: 12px; }
  td.member small.ctp { color: #7a4fc2; }
  .dd { color: #e07a1f; }
  td.empty { color: #9aa8b5; font-style: italic; }
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
${bodyRows(blocks, labels)}
</tbody>
</table>
</div>
<footer>${escapeHtml(labels.generatedAt)}</footer>
</body>
</html>
`;
}
