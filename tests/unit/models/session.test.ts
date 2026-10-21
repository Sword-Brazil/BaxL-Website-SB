import { describe, expect, it } from "vitest";
import { LoginSchema } from "@/models/schemas/auth";
import { SHORT_SESSION_MS, isSessionActive } from "@/server/sessionOptions";

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
