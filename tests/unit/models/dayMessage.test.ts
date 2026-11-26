import { describe, expect, it } from "vitest";
import { buildDayMessage, memberName, plainSequence, type DayMessageLabels } from "@/models/rules/dayMessage";

const labels: DayMessageLabels = {
  bestTeams: "Melhores times",
  rotation: "Rotação",
  leader: "Líder",
  and: "e",
  meta: "Meta",
  day: (n) => `Dia ${n}`,
  noRestriction: "Sem restrição",
  duo: "Dobradinha",
  striker: (striker, target, female) => `${striker} striker ${female ? "na" : "no"} ${target}`,
};

const m = (slot: "SOLO" | "SUPPORT_1" | "SUPPORT_2", agentName: string, uniform: string, extra: object = {}) => ({
  slot,
  name: memberName(agentName, uniform),
  agentName,
  female: false,
  isDamageDealer: false,
  strikerName: null,
  ...extra,
});

describe("mensagem do dia", () => {
  it("segue o modelo do grupo: título, times com Striker e vídeo, rotações", () => {
    const text = buildDayMessage({
      mode: "BAX",
      day: 5,
      effect: "Queimadura",
      criteria: ["Universal", "Humano"],
      labels,
      teams: [
        {
          duo: false,
          videoUrl: "https://youtu.be/vcZ3Mp2aW48?t=189",
          // Fora de ordem de propósito: o líder sempre vem primeiro.
          members: [
            m("SUPPORT_2", "Satana", "Satana"),
            m("SOLO", "Wanda", "Marvel Zombies", { female: true, isDamageDealer: true, strikerName: "Loki" }),
            m("SUPPORT_1", "Morgana LeFay", "Clássico"),
          ],
        },
        {
          duo: true,
          videoUrl: "https://youtu.be/R_mgXn3Qh9I",
          members: [
            m("SOLO", "Robbie Reyes", "Robbie Reyes"),
            m("SUPPORT_1", "Motoqueiro Fantasma", "Vingadores Selvagens", { isDamageDealer: true, strikerName: "Loki" }),
            m("SUPPORT_2", "Ghost Panther", "Ghost Panther"),
          ],
        },
      ],
      rotations: [
        {
          name: "Wanda (Marvel Zombies)",
          rotations: [
            {
              title: null,
              sequence: "2c3c4c1dc5 1 (repeat)\n6dc2c3c4c1dc5 1",
              description:
                "Skill 6: use quando faltarem 2 segundos para a skill 5 sair do cooldown.\nSkill 1: use quando a Wanda começar a descer em direção ao chão durante a animação da skill 5.",
            },
          ],
        },
        { name: "Motoqueiro Fantasma (Vingadores Selvagens)", rotations: [{ title: null, sequence: "1c2c5c3dc4 1c2\n3dc5c6dc4", description: null }] },
      ],
    });
    expect(text).toBe(`*BAX DIA 5 QUEIMADURA Universal Humano | Wanda Meta:*

*Melhores times:*

*1-* Wanda (Marvel Zombies) Líder, Morgana LeFay (Clássico) e Satana
Loki striker na Wanda

https://youtu.be/vcZ3Mp2aW48?t=189

*2- Dobradinha:* Robbie Reyes Líder, Motoqueiro Fantasma (Vingadores Selvagens) e Ghost Panther
Loki striker no Motoqueiro Fantasma

https://youtu.be/R_mgXn3Qh9I

*Rotação:*

- *Wanda (Marvel Zombies):*
2c3c4c1dc5 1 (repeat)
6dc2c3c4c1dc5 1

Skill 6: use quando faltarem 2 segundos para a skill 5 sair do cooldown.
Skill 1: use quando a Wanda começar a descer em direção ao chão durante a animação da skill 5.

- *Motoqueiro Fantasma (Vingadores Selvagens):*
1c2c5c3dc4 1c2
3dc5c6dc4`);
  });

  it("sem restrição, avisa; sem Causador de Dano, a Meta leva o nome do líder; sem vídeo nem rotação, as partes somem", () => {
    const text = buildDayMessage({
      mode: "BAL",
      day: 12,
      effect: null,
      criteria: [],
      labels,
      teams: [{ duo: false, videoUrl: null, members: [m("SOLO", "Thor", "Thor"), m("SUPPORT_1", "Loki", "Loki"), m("SUPPORT_2", "Hela", "Hela")] }],
      rotations: [{ name: "X", rotations: [] }],
    });
    expect(text).toBe("*BAL DIA 12 Sem restrição | Thor Meta:*\n\n*Melhores times:*\n\n*1-* Thor Líder, Loki e Hela");
  });

  it("título de rotação vai em itálico antes da sequência", () => {
    const text = buildDayMessage({
      mode: "BAX",
      day: 1,
      effect: "Paralisia",
      criteria: [],
      labels,
      teams: [],
      rotations: [{ name: "Wanda", rotations: [{ title: "Abertura", sequence: "1c2", description: null }, { title: null, sequence: "3c4", description: "Loop" }] }],
    });
    expect(text).toBe("*BAX DIA 1 PARALISIA Sem restrição:*\n\n*Rotação:*\n\n- *Wanda:*\n_Abertura_\n1c2\n\n3c4\n\nLoop");
  });

  it("tira os marcadores do site das rotações: | e / quebram a linha, * sai", () => {
    expect(plainSequence("1 2c (3dc 4) 7 | 5 6 *")).toBe("1 2c (3dc 4) 7\n5 6");
    expect(plainSequence("1c2 / 3dc5 *\n6dc4|*")).toBe("1c2\n3dc5\n6dc4");
    expect(plainSequence("2c3c4c1dc5 1 (repeat)")).toBe("2c3c4c1dc5 1 (repeat)");
  });
});
