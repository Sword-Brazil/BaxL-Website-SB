import bcrypt from "bcryptjs";
import { describe, expect, it } from "vitest";
import { prisma } from "@/server/db";
import { HttpError } from "@/server/http";
import { hashPassword, login } from "@/server/services/authService";

const IP = "10.0.0.1";

async function createUser(email = "jogador@sword.br", password = "senha1234") {
  return prisma.user.create({ data: { email, passwordHash: await hashPassword(password), role: "USER" } });
}

async function expectHttpError(p: Promise<unknown>, status: number) {
  await expect(p).rejects.toSatisfy((e) => e instanceof HttpError && e.status === status);
}

describe("authService.login", () => {
  it("login correto retorna o SessionUser (sem hash)", async () => {
    const u = await createUser();
    const user = await login({ email: " Jogador@Sword.BR ", password: "senha1234", ip: IP });
    expect(user).toEqual({ id: u.id, email: "jogador@sword.br", nickname: null, role: "USER" });
    expect(user).not.toHaveProperty("passwordHash");
  });

  it("senha errada e e-mail inexistente dão o mesmo erro genérico 401", async () => {
    await createUser();
    const wrong = login({ email: "jogador@sword.br", password: "errada123", ip: IP }).catch((e) => e);
    const missing = login({ email: "ninguem@sword.br", password: "errada123", ip: IP }).catch((e) => e);
    const [a, b] = await Promise.all([wrong, missing]);
    expect(a).toBeInstanceOf(HttpError);
    expect(a.status).toBe(401);
    expect(b.status).toBe(401);
    expect(a.message).toBe(b.message);
  });

  it("5 falhas em 15 min bloqueiam por 15 min (429), mesmo com a senha certa", async () => {
    await createUser();
    const t0 = new Date("2026-10-17T12:00:00Z");
    for (let i = 0; i < 5; i++) {
      await expectHttpError(
        login({ email: "jogador@sword.br", password: "errada123", ip: IP, now: new Date(t0.getTime() + i * 60_000) }),
        401,
      );
    }
    const blockedAt = new Date(t0.getTime() + 5 * 60_000);
    await expectHttpError(login({ email: "jogador@sword.br", password: "senha1234", ip: IP, now: blockedAt }), 429);

    const after = new Date(t0.getTime() + 4 * 60_000 + 15 * 60_000 + 1000);
    await expect(login({ email: "jogador@sword.br", password: "senha1234", ip: IP, now: after })).resolves.toBeTruthy();
  });

  it("falhas espalhadas por mais de 15 min não bloqueiam", async () => {
    await createUser();
    const t0 = Date.parse("2026-10-17T12:00:00Z");
    for (let i = 0; i < 6; i++) {
      await expectHttpError(
        login({ email: "jogador@sword.br", password: "errada123", ip: IP, now: new Date(t0 + i * 4 * 60_000) }),
        401,
      );
    }
  });

  it("login bem-sucedido zera as falhas", async () => {
    await createUser();
    for (let i = 0; i < 4; i++) {
      await expectHttpError(login({ email: "jogador@sword.br", password: "errada123", ip: IP }), 401);
    }
    await login({ email: "jogador@sword.br", password: "senha1234", ip: IP });
    for (let i = 0; i < 4; i++) {
      await expectHttpError(login({ email: "jogador@sword.br", password: "errada123", ip: IP }), 401);
    }
  });

  it("conta com e-mail não confirmado pode entrar", async () => {
    await createUser();
    const u = await prisma.user.findUniqueOrThrow({ where: { email: "jogador@sword.br" } });
    expect(u.emailVerifiedAt).toBeNull();
    await expect(login({ email: "jogador@sword.br", password: "senha1234", ip: IP })).resolves.toBeTruthy();
  });

  it("o hash nunca é igual à senha e usa bcrypt custo 12", async () => {
    const hash = await hashPassword("senha1234");
    expect(hash).not.toBe("senha1234");
    expect(bcrypt.getRounds(hash)).toBe(12);
  });
});
