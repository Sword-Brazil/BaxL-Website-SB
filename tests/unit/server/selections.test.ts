import { describe, expect, it, vi } from "vitest";
import { emptySelections } from "@/models/rules/selectionsSync";
import { prisma } from "@/server/db";
import { HttpError } from "@/server/http";
import { forgotPassword, login, register, resetPassword, verifyEmail } from "@/server/services/authService";
import { setMailService } from "@/server/services/mailService";
import { getSelections, putSelections } from "@/server/services/selectionsService";
import { createUser } from "./fixtures";

/** Captura os links enviados pelo MailService. */
function captureMail() {
  const sent: { to: string; kind: string; link: string }[] = [];
  setMailService({
    send: async (to, kind, link) => {
      sent.push({ to, kind, link });
    },
  });
  const tokenOf = (kind: string) => new URL(sent.filter((s) => s.kind === kind).at(-1)!.link, "http://x").searchParams.get("token")!;
  return { sent, tokenOf };
}

const status = (s: number) => (e: unknown) => e instanceof HttpError && e.status === s;

describe("selectionsService", () => {
  it("get retorna null sem documento; put cria e devolve updatedAt do servidor", async () => {
    const u = await createUser();
    expect(await getSelections(u.id)).toBeNull();
    const saved = await putSelections(u.id, { ...emptySelections(), roster: { ownedUniformIds: ["x"] } });
    expect(saved.roster.ownedUniformIds).toEqual(["x"]);
    expect((await getSelections(u.id))?.updatedAt).toBe(saved.updatedAt);
  });

  it("PUT com baseUpdatedAt divergente gera 409", async () => {
    const u = await createUser();
    const first = await putSelections(u.id, emptySelections());
    await putSelections(u.id, emptySelections(), first.updatedAt);
    await expect(putSelections(u.id, emptySelections(), first.updatedAt)).rejects.toSatisfy(status(409));
  });
});

describe("cadastro e recuperação", () => {
  it("register cria conta e envia link de verificação; e-mail repetido tem a mesma resposta", async () => {
    const mail = captureMail();
    const a = await register({ email: "novo@sword.br", password: "senha1234" });
    const b = await register({ email: "novo@sword.br", password: "outra1234" });
    expect(a).toEqual(b);
    expect(await prisma.user.count({ where: { email: "novo@sword.br" } })).toBe(1);
    expect(mail.sent.filter((s) => s.kind === "VERIFY_EMAIL")).toHaveLength(1);
  });

  it("token de verificação: só o hash fica no banco, uso único, expira em 24 h", async () => {
    const mail = captureMail();
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-17T12:00:00Z"));
    await register({ email: "v@sword.br", password: "senha1234" });
    const token = mail.tokenOf("VERIFY_EMAIL");
    expect(await prisma.authToken.count({ where: { tokenHash: token } })).toBe(0);

    vi.setSystemTime(new Date("2026-10-18T11:59:00Z"));
    await verifyEmail(token);
    expect((await prisma.user.findUniqueOrThrow({ where: { email: "v@sword.br" } })).emailVerifiedAt).not.toBeNull();
    await expect(verifyEmail(token)).rejects.toSatisfy(status(400));

    await register({ email: "w@sword.br", password: "senha1234" });
    const late = mail.tokenOf("VERIFY_EMAIL");
    vi.setSystemTime(new Date("2026-10-19T12:01:00Z"));
    await expect(verifyEmail(late)).rejects.toSatisfy(status(400));
    vi.useRealTimers();
  });

  it("reset de senha: não revela e-mail, expira em 1 h, uso único e troca a senha", async () => {
    const mail = captureMail();
    await forgotPassword("ninguem@sword.br");
    expect(mail.sent).toHaveLength(0);

    await register({ email: "r@sword.br", password: "senha1234" });
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-17T12:00:00Z"));
    await forgotPassword("r@sword.br");
    const token = mail.tokenOf("RESET_PASSWORD");

    vi.setSystemTime(new Date("2026-10-17T13:01:00Z"));
    await expect(resetPassword(token, "nova12345")).rejects.toSatisfy(status(400));

    vi.setSystemTime(new Date("2026-10-17T14:00:00Z"));
    await forgotPassword("r@sword.br");
    const fresh = mail.tokenOf("RESET_PASSWORD");
    await resetPassword(fresh, "nova12345");
    await expect(resetPassword(fresh, "outra12345")).rejects.toSatisfy(status(400));
    vi.useRealTimers();

    await expect(login({ email: "r@sword.br", password: "nova12345", ip: "1" })).resolves.toBeTruthy();
  });
});
