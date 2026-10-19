import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/server/db";
import { HttpError } from "@/server/http";
import { hashPassword, login, register, resetPassword, verifyEmail } from "@/server/services/authService";
import { ConsoleMailService, setMailService, type MailKind, type MailService } from "@/server/services/mailService";
import { dismissNotice, flushNotifications, listNotices, notify } from "@/server/services/notificationService";
import { adminResetPassword, changeRole } from "@/server/services/usersService";

const IP = "10.0.0.9";
let sent: { to: string; kind: MailKind; link: string }[] = [];

class FakeMail implements MailService {
  async send(to: string, kind: MailKind, link: string) {
    sent.push({ to, kind, link });
  }
}

beforeEach(() => {
  sent = [];
  setMailService(new FakeMail());
});
afterEach(() => setMailService(new ConsoleMailService()));

async function createUser(email = "alvo@sword.br", role = "USER") {
  return prisma.user.create({ data: { email, passwordHash: await hashPassword("senha1234"), role, emailVerifiedAt: new Date() } });
}

const session = (sid = "outra", loginAt = new Date(0)) => ({ sid, loginAt: loginAt.toISOString() });
const types = async (userId: string, s = session()) => (await listNotices(userId, s)).map((n) => n.type);
const flush = flushNotifications;

describe("notify: canal pela gravidade", () => {
  it("atenção grava o aviso e não manda e-mail", async () => {
    const u = await createUser();
    await notify({ type: "FAILED_LOGINS", userId: u.id });
    expect(await types(u.id)).toEqual(["FAILED_LOGINS"]);
    expect(sent).toEqual([]);
  });

  it("crítico grava o aviso e manda e-mail, sem dados sensíveis no link", async () => {
    const u = await createUser();
    await notify({ type: "ROLE_CHANGED", userId: u.id, params: { role: "CURATOR" } });
    const [notice] = await listNotices(u.id, session());
    expect(notice).toMatchObject({ type: "ROLE_CHANGED", severity: "CRITICAL", params: { role: "CURATOR" } });
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({ to: "alvo@sword.br", kind: "ROLE_CHANGED" });
    expect(sent[0].link).not.toContain("token");
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
    const other = await createUser("outro@sword.br");
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
    await login({ email: u.email, password: "senha1234", ip: IP, sessionId: "nova" });
    expect(await types(u.id, session("nova", before))).toEqual([]);
    expect(await types(u.id, session("antiga", before))).toEqual(["NEW_LOGIN"]);
    expect(await types(u.id, session("depois", new Date(Date.now() + 60_000)))).toEqual([]);
  });

  it("3 falhas avisam o dono; 5 bloqueiam e mandam e-mail", async () => {
    const u = await createUser();
    const t0 = new Date("2026-10-19T12:00:00Z");
    for (let i = 0; i < 5; i++) {
      await login({ email: u.email, password: "errada123", ip: IP, now: new Date(t0.getTime() + i * 1000) }).catch(() => null);
      if (i === 2) {
        await flush();
        expect(await types(u.id)).toEqual(["FAILED_LOGINS"]);
      }
    }
    await flush();
    expect((await types(u.id)).sort()).toEqual(["ACCOUNT_LOCKED", "FAILED_LOGINS"]);
    expect(sent.map((m) => m.kind)).toEqual(["ACCOUNT_LOCKED"]);
  });

  it("falhas com e-mail inexistente não gravam nada", async () => {
    for (let i = 0; i < 5; i++) await login({ email: "ninguem@sword.br", password: "errada123", ip: IP }).catch(() => null);
    await flush();
    expect(await prisma.securityNotice.count()).toBe(0);
    expect(sent).toEqual([]);
  });

  it("cadastro abre o aviso de e-mail não confirmado, que fecha ao confirmar", async () => {
    await register({ email: "novo@sword.br", password: "senha1234" });
    const user = await prisma.user.findUniqueOrThrow({ where: { email: "novo@sword.br" } });
    expect(await types(user.id)).toEqual(["EMAIL_UNVERIFIED"]);
    const token = new URL(sent.find((m) => m.kind === "VERIFY_EMAIL")!.link).searchParams.get("token")!;
    await verifyEmail(token);
    expect(await types(user.id)).toEqual([]);
  });

  it("redefinir a senha (link ou administrador) é crítico", async () => {
    const u = await createUser();
    await adminResetPassword(u.id, "nova12345");
    expect(await types(u.id)).toEqual(["PASSWORD_RESET"]);
    expect(sent.map((m) => m.kind)).toEqual(["PASSWORD_RESET"]);

    sent = [];
    await prisma.securityNotice.deleteMany();
    const { forgotPassword } = await import("@/server/services/authService");
    await forgotPassword(u.email);
    const token = new URL(sent[0].link).searchParams.get("token")!;
    await resetPassword(token, "outra12345");
    expect(await types(u.id)).toEqual(["PASSWORD_RESET"]);
    expect(sent.map((m) => m.kind)).toEqual(["RESET_PASSWORD", "PASSWORD_RESET"]);
  });

  it("troca de papel avisa; manter o mesmo papel não", async () => {
    await createUser("chefe@sword.br", "ADMIN");
    const u = await createUser();
    await changeRole(u.id, "USER");
    expect(await types(u.id)).toEqual([]);
    await changeRole(u.id, "CURATOR");
    expect(await types(u.id)).toEqual(["ROLE_CHANGED"]);
    expect(sent.map((m) => m.kind)).toEqual(["ROLE_CHANGED"]);
  });
});
