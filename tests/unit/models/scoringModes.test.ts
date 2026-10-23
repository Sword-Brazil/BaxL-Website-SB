import { describe, expect, it } from "vitest";
import { effectiveScoringModes, modeOfTeam, rotationVideos, sortModes, videoSearchUrl } from "@/models/rules/scoringModes";

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
    expect(rotationVideos({ videoUrl: "g", videoBax: null, videoBal: "l", videoBai: "i" })).toEqual([
      { mode: null, url: "g" },
      { mode: "BAL", url: "l" },
      { mode: "BAI", url: "i" },
    ]);
    expect(rotationVideos({ videoUrl: null, videoBax: null, videoBal: null, videoBai: null })).toEqual([]);
  });

  it("a sugestão é uma busca no YouTube pelo personagem e modo", () => {
    expect(videoSearchUrl("Doctor Strange", "BAX")).toBe("https://www.youtube.com/results?search_query=MFF%20Doctor%20Strange%20BAX%20rotation");
    expect(videoSearchUrl("Hela", null)).toContain("MFF%20Hela%20rotation");
  });
});
