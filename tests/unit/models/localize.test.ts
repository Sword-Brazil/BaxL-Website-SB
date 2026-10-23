import { describe, expect, it } from "vitest";
import { contentLang, pick, teamLabel } from "@/models/rules/localize";

describe("conteúdo em português e inglês", () => {
  it("o espanhol usa o inglês; o português é o padrão", () => {
    expect(contentLang("pt-BR")).toBe("pt");
    expect(contentLang(undefined)).toBe("pt");
    expect(contentLang("en")).toBe("en");
    expect(contentLang("es")).toBe("en");
  });

  it("sem a versão em inglês, fica o português", () => {
    expect(pick("Doutor Estranho", "Doctor Strange", "en")).toBe("Doctor Strange");
    expect(pick("Doutor Estranho", "Doctor Strange", "pt")).toBe("Doutor Estranho");
    expect(pick("Hela", null, "en")).toBe("Hela");
    expect(pick("Hela", "  ", "en")).toBe("Hela");
  });

  it("\"Alternativa N\" é traduzido sozinho; o rótulo em inglês cadastrado vence", () => {
    expect(teamLabel("Alternativa 2", null, "en")).toBe("Alternative 2");
    expect(teamLabel("Alternativa", null, "en")).toBe("Alternative");
    expect(teamLabel("Alternativa com fox", null, "en")).toBe("Alternativa com fox");
    expect(teamLabel("Alternativa com fox", "Alternative with Fox", "en")).toBe("Alternative with Fox");
    expect(teamLabel("Alternativa 2", "Plan B", "pt")).toBe("Alternativa 2");
    expect(teamLabel(null, null, "en")).toBeNull();
  });
});
