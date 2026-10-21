import { describe, expect, it } from "vitest";
import { APP_ERRORS, appErrorChannel, classifyError } from "@/models/domain/appErrors";
import { ApiError } from "@/models/api/client";

const api = (status: number) => new ApiError(status, "X", "x");

describe("padrão de erros do app", () => {
  it("classifica pelo status HTTP e pela falha de rede", () => {
    expect(classifyError(new TypeError("Failed to fetch"))).toBe("NETWORK");
    expect(classifyError(api(503))).toBe("DATABASE");
    expect(classifyError(api(500))).toBe("SERVER");
    expect(classifyError(api(403))).toBe("FORBIDDEN");
    expect(classifyError(api(401))).toBe("SESSION_EXPIRED");
    expect(classifyError(api(429))).toBe("RATE_LIMITED");
    expect(classifyError(api(409))).toBe("CONFLICT");
    expect(classifyError(api(400))).toBe("INVALID");
    expect(classifyError(api(415))).toBe("INVALID");
    expect(classifyError(new Error("qualquer"))).toBe("UNKNOWN");
  });

  it("graves (rede, banco, servidor, acesso negado, sessão) viram alerta fixo; o resto, notificação", () => {
    for (const kind of ["NETWORK", "DATABASE", "SERVER", "FORBIDDEN", "SESSION_EXPIRED"] as const) {
      expect(APP_ERRORS[kind]).toBe("CRITICAL");
      expect(appErrorChannel(kind)).toBe("alert");
    }
    for (const kind of ["RATE_LIMITED", "CONFLICT", "INVALID", "NOT_FOUND", "UNKNOWN"] as const) {
      expect(appErrorChannel(kind)).toBe("toast");
    }
  });
});
