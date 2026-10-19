import { describe, expect, it } from "vitest";
import { VALIDATION } from "@/models/schemas/messages";
import {
  AgentSchema,
  AssetUploadSchema,
  BaiBossesSchema,
  CreateStaffSchema,
  MetaTeamSchema,
  PrioritySchema,
  RestrictionSchema,
  RotationInputSchema,
  SettingsSchema,
} from "@/models/schemas/admin";

const members = [
  { slot: "SOLO", uniformId: "u1", ctpId: "c1" },
  { slot: "SUPPORT_1", uniformId: "u2", ctpId: "c1" },
  { slot: "SUPPORT_2", uniformId: "u3", ctpId: "c1" },
];

describe("RestrictionSchema", () => {
  it("aceita combinação de atributos distintos", () => {
    expect(
      RestrictionSchema.safeParse({
        criteria: [
          { attribute: "GENDER", value: "FEMALE" },
          { attribute: "SPECIES", value: "MUTANT" },
        ],
      }).success,
    ).toBe(true);
    expect(RestrictionSchema.safeParse({ criteria: [] }).success).toBe(true);
  });

  it("rejeita atributo repetido", () => {
    expect(
      RestrictionSchema.safeParse({
        criteria: [
          { attribute: "GENDER", value: "FEMALE" },
          { attribute: "GENDER", value: "MALE" },
        ],
      }).success,
    ).toBe(false);
  });

  it("rejeita valor inválido para o atributo", () => {
    expect(RestrictionSchema.safeParse({ criteria: [{ attribute: "GENDER", value: "MUTANT" }] }).success).toBe(false);
  });
});

describe("MetaTeamSchema", () => {
  it("aceita equipe de dia válida", () => {
    expect(MetaTeamSchema.safeParse({ scope: "DAY", mode: "BAX", number: 4, isPrimary: true, members }).success).toBe(true);
  });

  it("exige exatamente 3 membros", () => {
    expect(MetaTeamSchema.safeParse({ scope: "BAI", isPrimary: true, members: members.slice(0, 2) }).success).toBe(false);
  });

  it("exige slots únicos", () => {
    const dup = [members[0], { ...members[1], slot: "SOLO" }, members[2]];
    expect(MetaTeamSchema.safeParse({ scope: "BAI", isPrimary: true, members: dup }).success).toBe(false);
  });

  it("rejeita o mesmo uniforme repetido", () => {
    const dup = [members[0], { ...members[1], uniformId: "u1" }, members[2]];
    expect(MetaTeamSchema.safeParse({ scope: "BAI", isPrimary: true, members: dup }).success).toBe(false);
  });

  it("notes ≤ 500", () => {
    expect(MetaTeamSchema.safeParse({ scope: "BAI", isPrimary: true, members, notes: "x".repeat(501) }).success).toBe(false);
  });

  it("dia obrigatório se scope = DAY e válido (sem dias de BAI)", () => {
    expect(MetaTeamSchema.safeParse({ scope: "DAY", isPrimary: true, members }).success).toBe(false);
    expect(MetaTeamSchema.safeParse({ scope: "DAY", mode: "BAX", number: 3, isPrimary: true, members }).success).toBe(false);
  });
});

describe("PrioritySchema", () => {
  it("rejeita uniforme repetido na mesma lista", () => {
    expect(PrioritySchema.safeParse({ solo: [{ uniformId: "u1" }, { uniformId: "u1" }], support: [] }).success).toBe(false);
    expect(PrioritySchema.safeParse({ solo: [{ uniformId: "u1" }], support: [{ uniformId: "u1" }] }).success).toBe(true);
  });
});

describe("CreateStaffSchema", () => {
  it("aceita CURATOR e ADMIN e rejeita USER", () => {
    const base = { email: "novo@sword.br", password: "senha1234" };
    expect(CreateStaffSchema.safeParse({ ...base, role: "ADMIN" }).success).toBe(true);
    expect(CreateStaffSchema.safeParse({ ...base, role: "CURATOR" }).success).toBe(true);
    expect(CreateStaffSchema.safeParse({ ...base, role: "USER" }).success).toBe(false);
  });

  it("rejeita e-mail inválido", () => {
    expect(CreateStaffSchema.safeParse({ email: "x", password: "senha1234", role: "ADMIN" }).success).toBe(false);
  });
});

describe("BaiBossesSchema", () => {
  it("exige position ≥ 1 e única, e tips ≤ 500", () => {
    expect(BaiBossesSchema.safeParse([{ position: 1, name: "A" }, { position: 2, name: "B" }]).success).toBe(true);
    expect(BaiBossesSchema.safeParse([{ position: 0, name: "A" }]).success).toBe(false);
    expect(BaiBossesSchema.safeParse([{ position: 1, name: "A" }, { position: 1, name: "B" }]).success).toBe(false);
    expect(BaiBossesSchema.safeParse([{ position: 1, name: "A", tips: "x".repeat(501) }]).success).toBe(false);
  });
});

describe("AgentSchema", () => {
  it("valida slug kebab-case e nome 1–80", () => {
    const ok = {
      slug: "scarlet-witch",
      name: "Scarlet Witch",
      uniforms: [
        {
          slug: "padrao",
          name: "Padrão",
          imagePath: "/assets/agents/scarlet-witch/padrao.png",
          gender: "FEMALE",
          side: "HERO",
          species: "MUTANT",
          attackType: "UNIVERSAL",
        },
      ],
    };
    expect(AgentSchema.safeParse(ok).success).toBe(true);
    expect(AgentSchema.safeParse({ ...ok, slug: "Scarlet Witch" }).success).toBe(false);
    expect(AgentSchema.safeParse({ ...ok, name: "" }).success).toBe(false);
    expect(AgentSchema.safeParse({ ...ok, uniforms: [] }).success).toBe(false);
    // Atributos são do traje: valor inválido no traje é recusado.
    expect(AgentSchema.safeParse({ ...ok, uniforms: [{ ...ok.uniforms[0], side: "NEUTRO" }] }).success).toBe(false);
  });
});

describe("SettingsSchema", () => {
  it("valida horas 0–23 e data ISO", () => {
    expect(SettingsSchema.safeParse({ cycleAnchor: "2026-10-15T15:00:00.000Z", dayTurnoverHour: 12, weeklyResetHour: 22 }).success).toBe(true);
    expect(SettingsSchema.safeParse({ cycleAnchor: "ontem", dayTurnoverHour: 12, weeklyResetHour: 22 }).success).toBe(false);
    expect(SettingsSchema.safeParse({ cycleAnchor: "2026-10-15T15:00:00.000Z", dayTurnoverHour: 24, weeklyResetHour: 22 }).success).toBe(false);
  });
});

describe("AssetUploadSchema", () => {
  it("aceita só PNG/WebP/JPEG", () => {
    expect(AssetUploadSchema.safeParse({ fileName: "a.png", mimeType: "image/png", base64: "AAAA" }).success).toBe(true);
    expect(AssetUploadSchema.safeParse({ fileName: "a.jpg", mimeType: "image/jpeg", base64: "AAAA" }).success).toBe(true);
    expect(AssetUploadSchema.safeParse({ fileName: "a.gif", mimeType: "image/gif", base64: "AAAA" }).success).toBe(false);
  });
});

describe("RotationInputSchema", () => {
  const base = { uniformId: null, sequence: "1 2c (3dc 4) 6" };
  it("a rotação é texto livre: qualquer forma de escrever é aceita, só não pode ficar vazia", () => {
    expect(RotationInputSchema.safeParse(base).success).toBe(true);
    expect(RotationInputSchema.safeParse({ ...base, sequence: "Abre com o 3, espera o escudo cair e solta o 6" }).success).toBe(true);
    expect(RotationInputSchema.safeParse({ ...base, sequence: "  " }).error?.issues[0].message).toBe(VALIDATION.rotationRequired);
  });
  it("o vídeo precisa ser YouTube ou .mp4/.webm", () => {
    expect(RotationInputSchema.safeParse({ ...base, videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }).success).toBe(true);
    expect(RotationInputSchema.safeParse({ ...base, videoUrl: "https://exemplo.com/pagina" }).error?.issues[0].message).toBe(VALIDATION.rotationVideo);
  });
  it("a equipe só marca o Causador de Dano (a rotação não fica na equipe)", () => {
    const team = {
      scope: "BAI" as const,
      isPrimary: true,
      members: (["SOLO", "SUPPORT_1", "SUPPORT_2"] as const).map((slot, i) => ({ slot, uniformId: `u${i}`, isDamageDealer: slot !== "SOLO" })),
    };
    expect(MetaTeamSchema.safeParse(team).success).toBe(true);
  });
});
