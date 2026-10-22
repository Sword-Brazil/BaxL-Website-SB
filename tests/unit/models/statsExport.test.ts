import { describe, expect, it } from "vitest";
import { renderStatsHtml } from "@/models/rules/statsExport";

const labels = {
  rank: "#",
  agent: "Personagem",
  ctps: "CTPs",
  total: "Total",
  days: "Dias",
  weeks: ["S1", "S2", "S3", "S4"],
  dayShort: (d: number) => `Dia ${d}`,
  noCtp: "Sem CTP",
  empty: "Nada",
  generatedAt: "Gerado agora",
};
const meta = { title: "Estatísticas", subtitle: "Metas", lang: "pt-BR" };

describe("renderStatsHtml", () => {
  it("lista personagens com ícones de CTP e dias, escapando os textos", () => {
    const html = renderStatsHtml(
      [
        {
          name: "Wanda <Scarlet>",
          portrait: "https://x/w.png",
          total: 3,
          weeks: [2, 1, 0, 0],
          ctps: [{ label: "Fúria · Brilhante", image: "https://x/rage.png", color: "#6600CC", count: 2 }],
          days: [
            { mode: "BAX", day: 1, ctp: "Fúria · Brilhante" },
            { mode: "BAL", day: 8, ctp: null },
          ],
        },
      ],
      labels,
      meta,
    );
    expect(html).toContain("Wanda &lt;Scarlet&gt;");
    expect(html).toContain('src="https://x/rage.png"');
    expect(html).toContain("×2");
    expect(html).toContain("BAX · Dia 1");
    expect(html).toContain("BAL · Dia 8");
  });

  it("sem personagens, mostra a mensagem de vazio", () => {
    expect(renderStatsHtml([], labels, meta)).toContain("Nada");
  });
});
