import { describe, expect, it } from "vitest";
import { prisma } from "@/server/db";
import { HttpError } from "@/server/http";
import { hashPassword, login } from "@/server/services/authService";
import { dismissNotice, flushNotifications, listNotices, notify } from "@/server/services/notificationService";
import { adminResetPassword, changeRole } from "@/server/services/usersService";

const IP = "10.0.0.9";
async function createUser(username = "alvo", role = "CURATOR") {
  return prisma.user.create({ data: { username, passwordHash: await hashPassword("senha1234"), role } });
}

const session = (sid = "outra", loginAt = new Date(0)) => ({ sid, loginAt: loginAt.toISOString() });
const types = async (userId: string, s = session()) => (await listNotices(userId, s)).map((n) => n.type);
const flush = flushNotifications;

describe("notify: canal pela gravidade", () => {
  it("atenção grava o aviso persistente", async () => {
    const u = await createUser();
    await notify({ type: "FAILED_LOGINS", userId: u.id });
    expect(await types(u.id)).toEqual(["FAILED_LOGINS"]);
  });

  it("crítico grava o aviso com a gravidade e os parâmetros", async () => {
    const u = await createUser();
    await notify({ type: "ROLE_CHANGED", userId: u.id, params: { role: "CURATOR" } });
    const [notice] = await listNotices(u.id, session());
    expect(notice).toMatchObject({ type: "ROLE_CHANGED", severity: "CRITICAL", params: { role: "CURATOR" } });
  });

  it("evento repetido atualiza o mesmo aviso em vez de empilhar", async () => {
    const u = await createUser();
    await notify({ type: "ROLE_CHANGED", userId: u.id, params: { role: "CURATOR" } });
    await notify({ type: "ROLE_CHANGED", userId: u.id, params: { role: "ADMIN" } });
    expect(await prisma.securityNotice.count({ where: { userId: u.id } })).toBe(1);
    expect((await listNotices(u.id, session()))[0].params).toEqual({ role: "ADMIN" });
  });

  it("dispensar esconde o aviso; só o dono pode dispensar", async () => {
    const u = await createUser();
    const other = await createUser("outro");
    await notify({ type: "FAILED_LOGINS", userId: u.id });
    const [notice] = await listNotices(u.id, session());
    await expect(dismissNotice(other.id, notice.id)).rejects.toBeInstanceOf(HttpError);
    await dismissNotice(u.id, notice.id);
    expect(await types(u.id)).toEqual([]);
  });
});

describe("eventos ligados ao notify", () => {
  it("novo login aparece só nas outras sessões abertas antes dele", async () => {
    const u = await createUser();
    const before = new Date(Date.now() - 60_000);
    await login({ username: u.username, password: "senha1234", ip: IP, sessionId: "nova" });
    expect(await types(u.id, session("nova", before))).toEqual([]);
    expect(await types(u.id, session("antiga", before))).toEqual(["NEW_LOGIN"]);
    expect(await types(u.id, session("depois", new Date(Date.now() + 60_000)))).toEqual([]);
  });

  it("3 falhas avisam o dono; 5 bloqueiam e avisam do bloqueio", async () => {
    const u = await createUser();
    const t0 = new Date("2026-10-19T12:00:00Z");
    for (let i = 0; i < 5; i++) {
      await login({ username: u.username, password: "errada123", ip: IP, now: new Date(t0.getTime() + i * 1000) }).catch(() => null);
      if (i === 2) {
        await flush();
        expect(await types(u.id)).toEqual(["FAILED_LOGINS"]);
      }
    }
    await flush();
    expect((await types(u.id)).sort()).toEqual(["ACCOUNT_LOCKED", "FAILED_LOGINS"]);
  });

  it("falhas com usuário inexistente não gravam nada", async () => {
    for (let i = 0; i < 5; i++) await login({ username: "ninguem", password: "errada123", ip: IP }).catch(() => null);
    await flush();
    expect(await prisma.securityNotice.count()).toBe(0);
  });

  it("redefinir a senha pelo administrador é crítico", async () => {
    const u = await createUser();
    await adminResetPassword(u.id, "nova12345");
    expect(await types(u.id)).toEqual(["PASSWORD_RESET"]);
  });

  it("avisos de tipos que saíram do catálogo não aparecem", async () => {
    const u = await createUser();
    await prisma.securityNotice.create({ data: { userId: u.id, type: "EMAIL_UNVERIFIED" } });
    expect(await types(u.id)).toEqual([]);
  });

  it("troca de papel avisa; manter o mesmo papel não", async () => {
    await createUser("chefe@sword.br", "ADMIN");
    const u = await createUser();
    await changeRole(u.id, "CURATOR");
    expect(await types(u.id)).toEqual([]);
    await changeRole(u.id, "ADMIN");
    expect(await types(u.id)).toEqual(["ROLE_CHANGED"]);
  });
});
