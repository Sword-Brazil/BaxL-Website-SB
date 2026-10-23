import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { HttpError } from "@/server/http";
import { getAdminGuide, readAdminGuideImage } from "@/server/services/adminGuideService";

describe("guia da Administração (só para admins)", () => {
  it("traz os textos no idioma pedido (português se desconhecido) e as marcações dos prints", async () => {
    const pt = await getAdminGuide("pt-BR");
    expect(pt.title).toBe("Administração");
    expect((await getAdminGuide("en")).title).toBe("Administration");
    expect((await getAdminGuide("xx")).title).toBe("Administração");
    expect(pt.shots.desktop.markers.length).toBeGreaterThan(0);
  });

  it("só serve os prints conhecidos (nada de caminhos arbitrários)", async () => {
    expect((await readAdminGuideImage("admin-desktop-dark.jpg")).length).toBeGreaterThan(1000);
    for (const name of ["../admin.json", "admin.json", "admin-desktop-dark.png", "/etc/passwd"]) {
      await expect(readAdminGuideImage(name)).rejects.toSatisfy((e) => e instanceof HttpError && e.status === 404);
    }
  });

  it("nada da Administração fica nos arquivos públicos do guia", () => {
    expect(readdirSync(path.join("public", "guide")).filter((f) => f.startsWith("admin"))).toEqual([]);
    expect(Object.keys(JSON.parse(readFileSync(path.join("src", "views", "about", "guideShots.json"), "utf8")))).not.toContain("admin");
    for (const locale of readdirSync(path.join("public", "locales"))) {
      const about = JSON.parse(readFileSync(path.join("public", "locales", locale, "about.json"), "utf8"));
      expect(Object.keys(about.sections)).not.toContain("admin");
    }
  });
});
