import { describe, expect, it } from "vitest";
import { emptySelections } from "@/models/rules/selections";
import { HttpError } from "@/server/http";
import { getSelections, putSelections } from "@/server/services/selectionsService";
import { createUser } from "./fixtures";

const status = (code: number) => (e: unknown) => e instanceof HttpError && e.status === code;

// Elenco, equipes, CTPs e nome no jogo do jogador logado, iguais em todos os aparelhos.
describe("selectionsService", () => {
  it("get retorna null sem documento; put cria e devolve updatedAt do servidor", async () => {
    const u = await createUser();
    expect(await getSelections(u.id)).toBeNull();
    const saved = await putSelections(u.id, { ...emptySelections(), roster: { ownedUniformIds: ["x"] } });
    expect(saved.roster.ownedUniformIds).toEqual(["x"]);
    expect((await getSelections(u.id))?.updatedAt).toBe(saved.updatedAt);
  });

  it("os CTPs equipados e o nome no jogo são salvos e voltam da conta", async () => {
    const u = await createUser();
    await putSelections(u.id, { ...emptySelections(), nickname: "TenMenezes", equipment: { ctpByAgent: { agente1: "ctp1" } } });
    const doc = await getSelections(u.id);
    expect(doc?.equipment).toEqual({ ctpByAgent: { agente1: "ctp1" } });
    expect(doc?.nickname).toBe("TenMenezes");
  });

  it("as pontuações do jogador (dia e modo), a temporada de cada ciclo e o CTP 2 voltam da conta", async () => {
    const u = await createUser();
    const scores = { "2026-10-22|BAX": 1250000, "2026-10-24|BAI": 3400000 };
    const scoreSeasons = { "2026-10-01": "PARALYSIS_SHOCK" as const };
    await putSelections(u.id, { ...emptySelections(), scores, scoreSeasons, equipment: { ctpByAgent: { a: "c1" }, ctp2ByAgent: { a: "c2" } } });
    const doc = await getSelections(u.id);
    expect(doc?.scores).toEqual(scores);
    expect(doc?.scoreSeasons).toEqual(scoreSeasons);
    expect(doc?.equipment.ctp2ByAgent).toEqual({ a: "c2" });
  });

  it("a escolha livre e o Striker de cada personagem da equipe voltam da conta", async () => {
    const u = await createUser();
    await putSelections(u.id, {
      ...emptySelections(),
      freePick: true,
      teams: { "BAX-1": { SOLO: { uniformId: "u1", ctpId: null, strikerUniformId: "u9" } } },
    });
    const doc = await getSelections(u.id);
    expect(doc?.freePick).toBe(true);
    expect(doc?.teams["BAX-1"].SOLO).toMatchObject({ uniformId: "u1", strikerUniformId: "u9" });
  });

  it("PUT com baseUpdatedAt divergente gera 409", async () => {
    const u = await createUser();
    const first = await putSelections(u.id, emptySelections());
    await putSelections(u.id, emptySelections(), first.updatedAt);
    await expect(putSelections(u.id, emptySelections(), first.updatedAt)).rejects.toSatisfy(status(409));
  });

  it("dois aparelhos salvando ao mesmo tempo sobre a mesma base: um grava, o outro recebe 409", async () => {
    const u = await createUser();
    const base = await putSelections(u.id, emptySelections());
    const devices = ["aparelho-a", "aparelho-b", "aparelho-c"].map((id) =>
      putSelections(u.id, { ...emptySelections(), roster: { ownedUniformIds: [id] } }, base.updatedAt).then(
        () => "ok",
        (e) => (status(409)(e) ? "409" : e),
      ),
    );
    const results = await Promise.all(devices);
    expect(results.filter((r) => r === "ok")).toHaveLength(1);
    expect(results.filter((r) => r === "409")).toHaveLength(2);
  });

  it("primeira gravação simultânea em dois aparelhos (sem base): só uma cria, a outra recebe 409", async () => {
    const u = await createUser();
    const results = await Promise.all(
      ["a", "b"].map((id) =>
        putSelections(u.id, { ...emptySelections(), roster: { ownedUniformIds: [id] } }, null).then(
          () => "ok",
          (e) => (status(409)(e) ? "409" : e),
        ),
      ),
    );
    expect(results.sort()).toEqual(["409", "ok"]);
  });
});
