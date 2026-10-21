import type { NextApiRequest } from "next";
import { describe, expect, it } from "vitest";
import { safeNextPath } from "@/models/rules/safeRedirect";
import { HttpError, assertSameOrigin } from "@/server/http";

describe("safeNextPath (destino depois do login)", () => {
  it("aceita caminhos do próprio site", () => {
    expect(safeNextPath("/meu-elenco")).toBe("/meu-elenco");
    expect(safeNextPath("/rotacoes/luna-snow?traje=x")).toBe("/rotacoes/luna-snow?traje=x");
  });

  it("recusa outros domínios, esquemas e caracteres de controle", () => {
    for (const bad of ["//evil.com", "/\\evil.com", "https://evil.com", "javascript:alert(1)", "/a\nb", "/a\\b", "", undefined, ["/x"]]) {
      expect(safeNextPath(bad)).toBeNull();
    }
  });
});

const req = (method: string, headers: Record<string, string>) => ({ method, headers: { host: "mff.vercel.app", ...headers } }) as unknown as NextApiRequest;
const status = (fn: () => void) => {
  try {
    fn();
    return 200;
  } catch (e) {
    return e instanceof HttpError ? e.status : 500;
  }
};

describe("assertSameOrigin (CSRF)", () => {
  it("GET passa sempre", () => {
    expect(status(() => assertSameOrigin(req("GET", {})))).toBe(200);
  });

  it("POST do próprio site, em JSON, passa", () => {
    expect(status(() => assertSameOrigin(req("POST", { origin: "https://mff.vercel.app", "content-type": "application/json", "content-length": "10" })))).toBe(200);
    expect(status(() => assertSameOrigin(req("POST", { referer: "https://mff.vercel.app/entrar" })))).toBe(200);
  });

  it("POST de outro site ou sem origem é recusado (403)", () => {
    expect(status(() => assertSameOrigin(req("POST", { origin: "https://evil.com", "content-type": "application/json" })))).toBe(403);
    expect(status(() => assertSameOrigin(req("DELETE", {})))).toBe(403);
  });

  it("corpo que não é JSON é recusado (415)", () => {
    const form = { origin: "https://mff.vercel.app", "content-type": "application/x-www-form-urlencoded", "content-length": "20" };
    expect(status(() => assertSameOrigin(req("POST", form)))).toBe(415);
  });
});

describe("banco fora do ar vira 503", () => {
  it("reconhece os erros de conexão do Prisma e ignora os demais", async () => {
    const { Prisma } = await import("@prisma/client");
    const { isDatabaseUnavailable } = await import("@/server/http");
    const known = (code: string) => new Prisma.PrismaClientKnownRequestError("x", { code, clientVersion: "6" });
    expect(isDatabaseUnavailable(known("P1001"))).toBe(true);
    expect(isDatabaseUnavailable(known("P2024"))).toBe(true);
    expect(isDatabaseUnavailable(new Prisma.PrismaClientInitializationError("x", "6"))).toBe(true);
    expect(isDatabaseUnavailable(known("P2002"))).toBe(false);
    expect(isDatabaseUnavailable(new Error("x"))).toBe(false);
  });
});
