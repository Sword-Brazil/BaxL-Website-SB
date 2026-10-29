import { describe, expect, it } from "vitest";
import { LoginSchema } from "@/models/schemas/auth";
import { RENEW_AFTER_MS, SHORT_SESSION_MS, isSessionActive, shouldRenewSession } from "@/server/sessionOptions";

describe("manter logado", () => {
  it("vem desmarcado por padrão", () => {
    expect(LoginSchema.parse({ username: "sword menezes", password: "x" }).remember).toBe(false);
    expect(LoginSchema.parse({ username: "sword menezes", password: "x", remember: true }).remember).toBe(true);
  });

  it("sessão curta (sem manter logado) expira; a longa não tem prazo próprio", () => {
    const now = Date.parse("2026-10-21T12:00:00Z");
    expect(isSessionActive({ userId: "u1" }, now)).toBe(true);
    expect(isSessionActive({ userId: "u1", expiresAt: now + SHORT_SESSION_MS }, now)).toBe(true);
    expect(isSessionActive({ userId: "u1", expiresAt: now - 1 }, now)).toBe(false);
    expect(isSessionActive({}, now)).toBe(false);
  });
});

describe("renovação do manter logado", () => {
  const now = Date.parse("2026-10-28T12:00:00Z");

  it("regrava o cookie no máximo uma vez por dia", () => {
    expect(shouldRenewSession({ userId: "u1", remember: true, renewedAt: now - RENEW_AFTER_MS }, now)).toBe(true);
    expect(shouldRenewSession({ userId: "u1", remember: true, renewedAt: now - RENEW_AFTER_MS + 1 }, now)).toBe(false);
  });

  it("sessões de antes da renovação (sem renewedAt ou sem remember) também renovam", () => {
    expect(shouldRenewSession({ userId: "u1", remember: true }, now)).toBe(true);
    expect(shouldRenewSession({ userId: "u1" }, now)).toBe(true);
  });

  it("sessão curta e sessão vazia não renovam", () => {
    expect(shouldRenewSession({ userId: "u1", remember: false }, now)).toBe(false);
    expect(shouldRenewSession({}, now)).toBe(false);
  });
});
