import { describe, expect, it } from "vitest";
import { missingFields, schemaFields } from "@/server/prismaFreshness";

const schema = `
// comentário
model Uniform {
  id         String  @id @default(cuid())
  gender     String?
  active     Boolean @default(true)

  @@unique([id])
}

model Agent {
  id String @id
}
`;

describe("Prisma Client desatualizado", () => {
  it("lê os campos de cada model, ignorando atributos de bloco", () => {
    expect([...schemaFields(schema).get("Uniform")!]).toEqual(["id", "gender", "active"]);
  });

  it("aponta os campos que o client em memória não conhece", () => {
    const old = [
      { name: "Uniform", fields: [{ name: "id" }, { name: "active" }] },
      { name: "Agent", fields: [{ name: "id" }] },
    ];
    expect(missingFields(schema, old)).toEqual(["Uniform.gender"]);
    expect(missingFields(schema, [...old.slice(1), { name: "Uniform", fields: [{ name: "id" }, { name: "gender" }, { name: "active" }] }])).toEqual([]);
  });
});
