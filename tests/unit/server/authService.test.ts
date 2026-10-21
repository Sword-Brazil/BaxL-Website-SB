import bcrypt from "bcryptjs";
import { describe, expect, it } from "vitest";
import { prisma } from "@/server/db";
import { HttpError } from "@/server/http";
import { hashPassword, login } from "@/server/services/authService";

const IP = "10.0.0.1";

async function createUser(username = "jogador", password = "senha1234", role = "CURATOR") {
  return prisma.user.create({ data: { username, passwordHash: await hashPassword(password), role } });
}

async function expectHttpError(p: Promise<unknown>, status: number) {
  await expect(p).rejects.toSatisfy((e) => e instanceof HttpError && e.status === status);
}

describe("authService.login", () => {
  it("login correto retorna o SessionUser (sem hash)", async () => {
    const u = await createUser();
    const user = await login({ username: "  Jogador ", password: "senha1234", ip: IP });
    expect(user).toEqual({ id: u.id, username: "jogador", nickname: null, role: "CURATOR" });
    expect(user).not.toHaveProperty("passwordHash");
  });

  it("jogador (USER) entra com o nome de usuário, sem diferenciar maiúsculas", async () => {
    const u = await prisma.user.create({ data: { username: "tenmenezes", passwordHash: await hashPassword("senha1234"), role: "USER" } });
    const user = await login({ username: " TenMenezes ", password: "senha1234", ip: IP });
    expect(user).toEqual({ id: u.id, username: "tenmenezes", nickname: null, role: "USER" });
  });

  it("usuário inexistente e senha errada dão o mesmo 401", async () => {
    await prisma.user.create({ data: { username: "tenmenezes", passwordHash: await hashPassword("senha1234"), role: "USER" } });
    const wrong = await login({ username: "tenmenezes", password: "errada123", ip: IP }).catch((e) => e);
    const missing = await login({ username: "ninguem", password: "senha1234", ip: IP }).catch((e) => e);
    expect(wrong.status).toBe(401);
    expect(missing.status).toBe(401);
    expect(wrong.message).toBe(missing.message);
  });

  it("senha errada e usuário inexistente dão o mesmo erro genérico 401", async () => {
    await createUser();
    const wrong = login({ username: "jogador", password: "errada123", ip: IP }).catch((e) => e);
    const missing = login({ username: "ninguem", password: "errada123", ip: IP }).catch((e) => e);
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
        login({ username: "jogador", password: "errada123", ip: IP, now: new Date(t0.getTime() + i * 60_000) }),
        401,
      );
    }
    const blockedAt = new Date(t0.getTime() + 5 * 60_000);
    await expectHttpError(login({ username: "jogador", password: "senha1234", ip: IP, now: blockedAt }), 429);

    const after = new Date(t0.getTime() + 4 * 60_000 + 15 * 60_000 + 1000);
    await expect(login({ username: "jogador", password: "senha1234", ip: IP, now: after })).resolves.toBeTruthy();
  });

  it("falhas em paralelo contam todas: não dá para escapar do bloqueio com requisições simultâneas", async () => {
    await createUser();
    const attempts = Array.from({ length: 10 }, () => login({ username: "jogador", password: "errada123", ip: IP }).catch((e) => e));
    await Promise.all(attempts);
    const row = await prisma.loginAttempt.findUniqueOrThrow({ where: { key: `jogador|${IP}` } });
    expect(row.failedCount).toBeGreaterThanOrEqual(5);
    expect(row.lockedUntil).not.toBeNull();
    await expectHttpError(login({ username: "jogador", password: "senha1234", ip: IP }), 429);
  });

  it("falhas espalhadas por mais de 15 min não bloqueiam", async () => {
    await createUser();
    const t0 = Date.parse("2026-10-17T12:00:00Z");
    for (let i = 0; i < 6; i++) {
      await expectHttpError(
        login({ username: "jogador", password: "errada123", ip: IP, now: new Date(t0 + i * 4 * 60_000) }),
        401,
      );
    }
  });

  it("login bem-sucedido zera as falhas", async () => {
    await createUser();
    for (let i = 0; i < 4; i++) {
      await expectHttpError(login({ username: "jogador", password: "errada123", ip: IP }), 401);
    }
    await login({ username: "jogador", password: "senha1234", ip: IP });
    for (let i = 0; i < 4; i++) {
      await expectHttpError(login({ username: "jogador", password: "errada123", ip: IP }), 401);
    }
  });

  it("nome de usuário com espaços: espaços extras e maiúsculas não importam", async () => {
    await createUser("sword menezes", "Desenho.2020!", "ADMIN");
    await expect(login({ username: "  SWORD   Menezes ", password: "Desenho.2020!", ip: IP })).resolves.toMatchObject({ role: "ADMIN" });
  });

  it("o hash nunca é igual à senha e usa bcrypt custo 12", async () => {
    const hash = await hashPassword("senha1234");
    expect(hash).not.toBe("senha1234");
    expect(bcrypt.getRounds(hash)).toBe(12);
  });
});
