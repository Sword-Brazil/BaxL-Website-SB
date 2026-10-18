import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { CTP_TYPES } from "@/models/domain/enums";

const manifest: Record<string, string> = JSON.parse(readFileSync("prisma/data/images.json", "utf8")).ctps;

describe("ícones dos CTPs numa instalação nova", () => {
  it.each(CTP_TYPES)("%s tem imagem no manifesto, em img/CTPs e em public/assets/ctp (caminho do seed)", (type) => {
    const file = manifest[type];
    expect(file, `manifesto sem ${type}`).toBeTruthy();
    expect(existsSync(path.join("img", "CTPs", file))).toBe(true);
    expect(existsSync(path.join("public", "assets", "ctp", `${type.toLowerCase()}${path.extname(file)}`))).toBe(true);
  });
});
