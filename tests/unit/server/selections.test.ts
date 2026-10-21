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
