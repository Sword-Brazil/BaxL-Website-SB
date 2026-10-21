import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/server/db";
import { HttpError } from "@/server/http";
import { deleteMetaTeam, saveMetaTeam } from "@/server/services/metaTeamService";
import { setRestriction } from "@/server/services/restrictionService";
import { savePriority } from "@/server/services/priorityService";
import { changeRole, createUser as createAccount, listUsers } from "@/server/services/usersService";
import { createAgent, createUser, ctpId, dayId, seedBase } from "./fixtures";
import { deleteCtp, saveCtp } from "@/server/services/catalogAdminService";

const status = (s: number) => (e: unknown) => e instanceof HttpError && e.status === s;

describe("curadoria", () => {
  let curatorId: string;
  let fem: string[];
  let maleMutant: string;
  let ctp: string;

  beforeEach(async () => {
    await seedBase();
    curatorId = (await createUser("CURATOR")).id;
    ctp = await ctpId();
    fem = [];
    for (const s of ["f1", "f2", "f3"]) fem.push((await createAgent(s, { gender: "FEMALE", species: "MUTANT" })).uniform.id);
    maleMutant = (await createAgent("m1", { gender: "MALE", species: "MUTANT" })).uniform.id;
    await setRestriction("BAX", 6, [
      { attribute: "GENDER", value: "FEMALE" },
      { attribute: "SPECIES", value: "MUTANT" },
    ]);
  });

  const team = (uniforms: string[], extra: object = {}) => ({
    scope: "DAY" as const,
    mode: "BAX" as const,
    number: 6,
    isPrimary: true,
    members: (["SOLO", "SUPPORT_1", "SUPPORT_2"] as const).map((slot, i) => ({ slot, uniformId: uniforms[i], ctpId: ctp })),
    ...extra,
  });

  it("qualquer posição pode ser Causador de Dano, um ou mais por equipe", async () => {
    const base = team(fem);
    const saved = await saveMetaTeam(
      { ...base, members: base.members.map((m) => ({ ...m, isDamageDealer: m.slot !== "SOLO" })) },
      curatorId,
    );
    expect(Object.fromEntries(saved.members.map((m) => [m.slot, m.isDamageDealer]))).toEqual({
      SOLO: false,
      SUPPORT_1: true,
      SUPPORT_2: true,
    });
  });


  it("publicar com agente fora da restrição gera 422 RESTRICTION_VIOLATION", async () => {
    const err = await saveMetaTeam(team([maleMutant, fem[1], fem[2]]), curatorId).catch((e) => e);
    expect(err).toBeInstanceOf(HttpError);
    expect(err.status).toBe(422);
    expect(err.code).toBe("RESTRICTION_VIOLATION");
  });

  it("a restrição usa os atributos próprios do traje, não só os do personagem", async () => {
    const agentId = (await prisma.uniform.findUniqueOrThrow({ where: { id: maleMutant } })).agentId;
    const female = await prisma.uniform.create({
      data: { agentId, slug: "feminino", name: "Feminino", imagePath: "", gender: "FEMALE" },
    });
    await expect(saveMetaTeam(team([female.id, fem[1], fem[2]]), curatorId)).resolves.toBeTruthy();

    const male = await prisma.uniform.findUniqueOrThrow({ where: { id: fem[0] } });
    await prisma.uniform.update({ where: { id: male.id }, data: { gender: "MALE" } });
    const err = await saveMetaTeam(team([male.id, fem[1], fem[2]]), curatorId).catch((e) => e);
    expect(err.code).toBe("RESTRICTION_VIOLATION");
  });

  it("publicar equipe ou reserva com CTP desativado gera 400", async () => {
    await prisma.ctp.update({ where: { id: ctp }, data: { active: false } });
    await expect(saveMetaTeam(team(fem), curatorId)).rejects.toSatisfy(status(400));
    await expect(savePriority({ scope: "BAI" }, { solo: [{ uniformId: fem[0], ctpId: ctp }], support: [] })).rejects.toSatisfy(
      status(400),
    );
  });

  it("excluir um CTP tira ele das equipes e reservas, sem apagar as equipes", async () => {
    const saved = await saveMetaTeam(team(fem), curatorId);
    await savePriority({ scope: "BAI" }, { solo: [{ uniformId: fem[0], ctpId: ctp }], support: [] });
    await deleteCtp(ctp);
    expect(await prisma.ctp.findUnique({ where: { id: ctp } })).toBeNull();
    const members = await prisma.metaTeamMember.findMany({ where: { metaTeamId: saved.id } });
    expect(members).toHaveLength(3);
    expect(members.every((m) => m.ctpId === null)).toBe(true);
    expect((await prisma.priorityEntry.findFirstOrThrow()).ctpId).toBeNull();
    await expect(deleteCtp(ctp)).rejects.toSatisfy(status(404));
  });

  it("publicar com uniforme inativo gera 400", async () => {
    await prisma.uniform.update({ where: { id: fem[0] }, data: { active: false } });
    await expect(saveMetaTeam(team(fem), curatorId)).rejects.toSatisfy(status(400));
  });

  it("o mesmo agente em dois slots gera 400", async () => {
    const extra = await prisma.uniform.create({
      data: { agentId: (await prisma.uniform.findUniqueOrThrow({ where: { id: fem[0] } })).agentId, slug: "alt", name: "Alt", imagePath: "/x.png" },
    });
    await expect(saveMetaTeam(team([fem[0], extra.id, fem[2]]), curatorId)).rejects.toSatisfy(status(400));
  });

  it("grava autor e data, e só uma principal por dia", async () => {
    const a = await saveMetaTeam(team(fem), curatorId);
    expect(a.updatedBy).toBe("curator");
    const b = await saveMetaTeam(team([fem[2], fem[1], fem[0]]), curatorId);
    const day = await dayId("BAX", 6);
    const rows = await prisma.metaTeam.findMany({ where: { battleDayId: day } });
    expect(rows).toHaveLength(2);
    expect(rows.filter((r) => r.isPrimary).map((r) => r.id)).toEqual([b.id]);
    expect(rows.every((r) => r.updatedById === curatorId)).toBe(true);
  });

  it("editar e excluir uma MetaTeam", async () => {
    const a = await saveMetaTeam(team(fem), curatorId);
    const edited = await saveMetaTeam(team(fem, { notes: "nova nota" }), curatorId, a.id);
    expect(edited.id).toBe(a.id);
    expect(edited.notes).toBe("nova nota");
    await deleteMetaTeam(a.id);
    expect(await prisma.metaTeam.count()).toBe(0);
  });

  it("salva a foto de um CTP e preserva o registro ao desativá-lo", async () => {
    const id = await ctpId("RAGE", "NORMAL");
    const edited = await saveCtp({ type: "RAGE", quality: "NORMAL", imagePath: "/uploads/rage.png" }, id);
    expect(edited).toMatchObject({ id, imagePath: "/uploads/rage.png", active: true });

    const removed = await saveCtp({ type: "RAGE", quality: "NORMAL", imagePath: "/uploads/rage.png", active: false }, id);
    expect(removed).toMatchObject({ id, active: false });
    expect(await prisma.ctp.findUnique({ where: { id } })).not.toBeNull();
  });

  it("restrição: dia de BAI gera 404", async () => {
    await expect(setRestriction("BAX", 3, [])).rejects.toSatisfy(status(404));
  });

  it("prioridade da BAI não aceita uniforme fora do catálogo e grava ranks em ordem", async () => {
    await expect(savePriority({ scope: "BAI" }, { solo: [{ uniformId: "nao-existe" }], support: [] })).rejects.toSatisfy(status(400));
    await savePriority({ scope: "BAI" }, { solo: [{ uniformId: fem[1] }, { uniformId: fem[0] }], support: [{ uniformId: fem[2] }] });
    const rows = await prisma.priorityEntry.findMany({ where: { scope: "BAI" }, orderBy: [{ role: "asc" }, { rank: "asc" }] });
    expect(rows.map((r) => [r.role, r.rank, r.uniformId])).toEqual([
      ["SOLO", 1, fem[1]],
      ["SOLO", 2, fem[0]],
      ["SUPPORT", 1, fem[2]],
    ]);
  });

  it("prioridade de dia respeita a restrição", async () => {
    await expect(
      savePriority({ scope: "DAY", mode: "BAX", number: 6 }, { solo: [{ uniformId: maleMutant }], support: [] }),
    ).rejects.toSatisfy(status(422));
  });

  describe("usuários", () => {
    it("cria conta de administrador com e-mail; e-mail repetido gera 409", async () => {
      const u = await createAccount({ email: "novo@sword.br", password: "senha1234", role: "ADMIN" });
      expect(u.role).toBe("ADMIN");
      const row = await prisma.user.findUniqueOrThrow({ where: { id: u.id } });
      expect(row.emailVerifiedAt).not.toBeNull();
      expect(row.passwordHash).not.toBe("senha1234");
      await expect(createAccount({ email: "NOVO@sword.br", password: "senha1234", role: "CURATOR" })).rejects.toSatisfy(status(409));
    });

    it("cria jogador só com nome de usuário (minúsculo); usuário repetido gera 409", async () => {
      const u = await createAccount({ username: "tenmenezes", password: "senha1234", role: "USER" });
      expect(u).toMatchObject({ username: "tenmenezes", email: null, role: "USER" });
      await expect(createAccount({ username: "TenMenezes", password: "senha1234", role: "USER" })).rejects.toSatisfy(status(409));
      await expect(createAccount({ password: "senha1234", role: "USER" })).rejects.toSatisfy(status(400));
    });

    it("a busca acha por usuário, e-mail ou apelido, sem diferenciar maiúsculas", async () => {
      await createAccount({ username: "tenmenezes", nickname: "Ten Menezes", password: "senha1234", role: "USER" });
      await createAccount({ email: "curador@sword.br", password: "senha1234", role: "CURATOR" });
      expect((await listUsers({ q: "MENEZES" })).users.map((u) => u.username)).toEqual(["tenmenezes"]);
      expect((await listUsers({ q: "Curador@" })).users.map((u) => u.email)).toEqual(["curador@sword.br"]);
    });

    it("rebaixar o último ADMIN gera 409", async () => {
      const admin = await createUser("ADMIN");
      await expect(changeRole(admin.id, "USER")).rejects.toSatisfy(status(409));
      await createUser("ADMIN", "outro@sword.br");
      await expect(changeRole(admin.id, "CURATOR")).resolves.toMatchObject({ role: "CURATOR" });
    });
  });
});
