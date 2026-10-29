import { describe, expect, it } from "vitest";
import { prisma } from "@/server/db";
import { isSchemaMismatch } from "@/server/http";
import { checkSchema } from "@/server/services/healthService";

async function errorOf(promise: Promise<unknown>) {
  return promise.then(
    () => null,
    (e: unknown) => e,
  );
}

describe("banco fora de sincronia com o código (manutenção)", () => {
  it("banco em dia: a checagem passa", async () => {
    await expect(checkSchema()).resolves.toBeUndefined();
  });

  it("coluna que o código usa e o banco não tem: é manutenção", async () => {
    await prisma.$executeRawUnsafe(`ALTER TABLE "Settings" RENAME COLUMN "season" TO "season_old"`);
    try {
      const e = await errorOf(checkSchema());
      expect(e).not.toBeNull();
      expect(isSchemaMismatch(e)).toBe(true);
    } finally {
      await prisma.$executeRawUnsafe(`ALTER TABLE "Settings" RENAME COLUMN "season_old" TO "season"`);
    }
  });

  it("tabela que o código usa e o banco não tem: é manutenção", async () => {
    await prisma.$executeRawUnsafe(`ALTER TABLE "Rotation" RENAME TO "Rotation_old"`);
    try {
      expect(isSchemaMismatch(await errorOf(checkSchema()))).toBe(true);
    } finally {
      await prisma.$executeRawUnsafe(`ALTER TABLE "Rotation_old" RENAME TO "Rotation"`);
    }
  });

  it("SQL direto em coluna inexistente também é manutenção; outros erros não", async () => {
    expect(isSchemaMismatch(await errorOf(prisma.$queryRawUnsafe(`SELECT "nope" FROM "Settings"`)))).toBe(true);
    expect(isSchemaMismatch(await errorOf(prisma.$queryRawUnsafe(`SELECT 1/0`)))).toBe(false);
    expect(isSchemaMismatch(new Error("x"))).toBe(false);
  });
});
