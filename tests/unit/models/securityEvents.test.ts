import { describe, expect, it } from "vitest";
import { SECURITY_EVENTS, channelsOf, isNoticeEvent, severityOf, type SecurityEventType } from "@/models/domain/securityEvents";

const ALL = Object.keys(SECURITY_EVENTS) as SecurityEventType[];

describe("catálogo de eventos de segurança", () => {
  it("informativo vai só para o toast", () => {
    for (const type of ["SESSION_EXPIRED", "SELECTIONS_SYNCED", "PASSWORD_CHANGED"] as const) {
      expect(severityOf(type)).toBe("INFO");
      expect(channelsOf(type)).toEqual(["toast"]);
    }
  });

  it("atenção vai só para o aviso persistente", () => {
    for (const type of ["EMAIL_UNVERIFIED", "NEW_LOGIN", "FAILED_LOGINS"] as const) {
      expect(channelsOf(type)).toEqual(["banner"]);
    }
  });

  it("crítico vai para o e-mail e para o aviso persistente", () => {
    for (const type of ["PASSWORD_RESET", "ROLE_CHANGED", "ACCOUNT_LOCKED"] as const) {
      expect(channelsOf(type)).toEqual(["email", "banner"]);
    }
  });

  it("nenhum evento combina toast com outro canal, e todo evento tem canal", () => {
    for (const type of ALL) {
      const channels = channelsOf(type);
      expect(channels.length).toBeGreaterThan(0);
      if (channels.includes("toast")) expect(channels).toEqual(["toast"]);
    }
  });

  it("isNoticeEvent reconhece só os eventos que viram aviso", () => {
    expect(isNoticeEvent("NEW_LOGIN")).toBe(true);
    expect(isNoticeEvent("ROLE_CHANGED")).toBe(true);
    expect(isNoticeEvent("SESSION_EXPIRED")).toBe(false);
    expect(isNoticeEvent("QUALQUER")).toBe(false);
  });
});
