import { describe, expect, it } from "vitest";
import { escapeHtml, renderTeamsHtml, type ExportBlock, type ExportLabels } from "@/models/rules/teamsExport";

const labels: ExportLabels = {
  day: "Dia",
  mode: "Modo",
  restriction: "Restrição",
  team: "Equipe",
  slots: { SOLO: "Líder", SUPPORT_1: "Esquerda", SUPPORT_2: "Direita" },
  damageDealer: "Causador de Dano",
  empty: "—",
  noTeams: "Sem equipe definida",
  generatedAt: "Gerado agora",
};
const meta = { title: "Equipes", subtitle: "Semana 1", lang: "pt-BR" };
const m = (name: string, extra: object = {}) => ({ name, uniform: null, ctp: null, damageDealer: false, portrait: null, ...extra });

const blocks: ExportBlock[] = [
  {
    day: 1,
    weekday: "QUI",
    mode: "BAX",
    restriction: "Feminino + Herói",
    teams: [
      { kind: "META", label: "Meta", members: { SOLO: m("Misty Knight"), SUPPORT_1: m("Luna Snow"), SUPPORT_2: m("White Fox", { damageDealer: true }) } },
      { kind: "MINE", label: "Minha equipe", members: { SOLO: m("Misty Knight") } },
    ],
  },
  { day: 1, weekday: "QUI", mode: "BAL", restriction: "Sem restrição", teams: [] },
];

describe("renderTeamsHtml", () => {
  const html = renderTeamsHtml(blocks, labels, meta);

  it("gera um documento HTML completo com o cabeçalho na ordem Esquerda · Líder · Direita", () => {
    expect(html.startsWith("<!doctype html>")).toBe(true);
    expect(html).toContain('<html lang="pt-BR">');
    const head = html.slice(html.indexOf("<thead>"), html.indexOf("</thead>"));
    expect(head.indexOf("Esquerda")).toBeLessThan(head.indexOf("Líder"));
    expect(head.indexOf("Líder")).toBeLessThan(head.indexOf("Direita"));
  });

  it("agrupa o dia (rowspan = todas as linhas do dia) e o modo (linhas do modo)", () => {
    expect(html).toContain('rowspan="3" class="day">1');
    expect(html).toMatch(/rowspan="2" class="mode"[^>]*><span>BAX/);
    expect(html).toMatch(/rowspan="1" class="mode"[^>]*><span>BAL/);
  });

  it("marca o Causador de Dano, mostra posição vazia e modo sem equipe", () => {
    expect(html).toContain('<span class="dd" title="Causador de Dano">⚔</span>');
    expect(html).toContain('<td class="member empty">—</td>');
    expect(html).toContain("Sem equipe definida");
  });

  it("escapa todo texto vindo dos dados", () => {
    const evil = renderTeamsHtml(
      [{ day: 2, weekday: "SEX", mode: "BAI", restriction: "<b>x</b>", teams: [{ kind: "ALT", label: '"><script>', members: {} }] }],
      labels,
      { ...meta, title: "<script>alert(1)</script>" },
    );
    expect(evil).not.toContain("<script>");
    expect(evil).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(escapeHtml(`a&b<'"`)).toBe("a&amp;b&lt;&#39;&quot;");
  });
});
