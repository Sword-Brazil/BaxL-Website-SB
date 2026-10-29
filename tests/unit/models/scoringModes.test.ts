import { describe, expect, it } from "vitest";
import { effectiveScoringModes, hasSeasonVideos, modeOfTeam, rotationVideos, sortModes, videoSearchUrl } from "@/models/rules/scoringModes";

describe("modos em que o personagem pontua", () => {
  it("o modo vem do dia, da BAI ou da BAL livre", () => {
    expect(modeOfTeam("DAY", "BAX")).toBe("BAX");
    expect(modeOfTeam("BAI", null)).toBe("BAI");
    expect(modeOfTeam("BAL_FREE", null)).toBe("BAL");
    expect(modeOfTeam("DAY", null)).toBeNull();
  });

  it("automático usa os detectados; manual, os escolhidos; sempre na ordem BAX · BAL · BAI", () => {
    const agent = { scoringAuto: true, scoringModes: ["BAI"], detectedScoringModes: ["BAL", "BAX", "BAL"] };
    expect(effectiveScoringModes(agent)).toEqual(["BAX", "BAL"]);
    expect(effectiveScoringModes({ ...agent, scoringAuto: false })).toEqual(["BAI"]);
    expect(sortModes(["BAI", "BAX", "x"])).toEqual(["BAX", "BAI"]);
  });
});

describe("vídeos da rotação", () => {
  it("o geral primeiro, depois cada modo que tiver vídeo", () => {
    expect(rotationVideos({ videoUrl: "g", videoBax: null, videoBal: "l", videoBai: "i", effectVideos: {} }, null)).toEqual([
      { mode: null, url: "g", seasonal: false },
      { mode: "BAL", url: "l", seasonal: false },
      { mode: "BAI", url: "i", seasonal: false },
    ]);
    expect(rotationVideos({ videoUrl: null, videoBax: null, videoBal: null, videoBai: null, effectVideos: {} }, "PARALYSIS_SHOCK")).toEqual([]);
  });

  it("na BAX e na BAL vale o vídeo da temporada; sem ele, o do modo", () => {
    const r = { videoUrl: null, videoBax: "x", videoBal: "l", videoBai: null, effectVideos: { PARALYSIS: "p", TRAP: "t" } };
    expect(rotationVideos(r, "PARALYSIS_SHOCK")).toEqual([
      { mode: "BAX", url: "p", seasonal: true },
      { mode: "BAL", url: "l", seasonal: false },
    ]);
    expect(rotationVideos(r, "SILENCE_TRAP")).toEqual([
      { mode: "BAX", url: "x", seasonal: false },
      { mode: "BAL", url: "t", seasonal: true },
    ]);
    expect(hasSeasonVideos(r)).toBe(true);
    expect(hasSeasonVideos({ effectVideos: {} })).toBe(false);
  });

  it("a sugestão é uma busca no YouTube pelo personagem e modo", () => {
    expect(videoSearchUrl("Doctor Strange", "BAX")).toBe("https://www.youtube.com/results?search_query=MFF%20Doctor%20Strange%20BAX%20rotation");
    expect(videoSearchUrl("Hela", null)).toContain("MFF%20Hela%20rotation");
  });
});
