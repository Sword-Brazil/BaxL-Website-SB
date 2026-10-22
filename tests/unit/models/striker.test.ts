import { describe, expect, it } from "vitest";
import { metaStrikerOptions } from "@/models/rules/striker";

const opt = (id: string, isMetaStriker: boolean) => ({ id, uniform: { isMetaStriker } });

describe("metaStrikerOptions", () => {
  it("com tags no catálogo, só os Strikers meta", () => {
    expect(metaStrikerOptions([opt("a", true), opt("b", false)], true).map((o) => o.id)).toEqual(["a"]);
  });

  it("sem nenhuma tag no catálogo, todos", () => {
    expect(metaStrikerOptions([opt("a", false), opt("b", false)], false)).toHaveLength(2);
  });
});
