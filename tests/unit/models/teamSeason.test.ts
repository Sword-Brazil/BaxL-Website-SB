import { describe, expect, it } from "vitest";
import type { MetaTeam } from "@/models/domain/types";
import { teamForSeason, toSeasonMap } from "@/models/rules/teamSeason";
import { withoutScores } from "@/models/rules/scores";

const member = (slot: "SOLO" | "SUPPORT_1", isDamageDealer: boolean) => ({
  slot,
  uniformId: slot,
  ctpId: null,
  ctpSlot: null,
  isDamageDealer,
  strikerUniformId: "geral",
  seasonStrikers: { BURN_FRACTURE: "queimadura" },
});

const team = {
  videoUrl: "https://youtu.be/geral000000",
  seasonVideos: { SILENCE_TRAP: "https://youtu.be/silencio000" },
  members: [member("SOLO", true), member("SUPPORT_1", false)],
} as unknown as MetaTeam;

describe("equipe na temporada", () => {
  it("usa o vídeo e o Striker da temporada; sem eles, os gerais", () => {
    const burn = teamForSeason(team, "BURN_FRACTURE");
    expect(burn.videoUrl).toBe("https://youtu.be/geral000000");
    expect(burn.members.map((m) => m.strikerUniformId)).toEqual(["queimadura", "geral"]);
    const silence = teamForSeason(team, "SILENCE_TRAP");
    expect(silence.videoUrl).toBe("https://youtu.be/silencio000");
    expect(silence.members[0].strikerUniformId).toBe("geral");
  });

  it("JSON do banco: só temporadas conhecidas e com texto", () => {
    expect(toSeasonMap({ BURN_FRACTURE: " a ", SILENCE_TRAP: "", OUTRA: "x", PARALYSIS_SHOCK: 3 })).toEqual({ BURN_FRACTURE: "a" });
    expect(toSeasonMap(null)).toEqual({});
  });
});

describe("limpar pontuações", () => {
  const scores = { "2026-11-01|BAX": 1, "2026-11-01|BAX|pre": 2, "2026-11-01|BAL": 3, "2026-11-04|BAI": 4 };
  it("apaga só as do modo, inclusive antes do reset", () => {
    expect(withoutScores(scores, "BAX")).toEqual({ "2026-11-01|BAL": 3, "2026-11-04|BAI": 4 });
  });
  it("sem modo, apaga todas", () => {
    expect(withoutScores(scores)).toEqual({});
  });
});
