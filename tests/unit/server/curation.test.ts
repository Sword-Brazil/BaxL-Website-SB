import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/server/db";
import { HttpError } from "@/server/http";
import { deleteMetaTeam, listMetaTeams, reorderMetaTeams, saveMetaTeam } from "@/server/services/metaTeamService";
import { setRestriction } from "@/server/services/restrictionService";
import { savePriority } from "@/server/services/priorityService";
import { changeRole, createUser as createAccount, deleteUser, listUsers } from "@/server/services/usersService";
import { createAgent, createMetaTeam, createUser, ctpId, dayId, seedBase } from "./fixtures";
import { deleteCtp, saveCtp } from "@/server/services/catalogAdminService";
import { setFreeDaysSync } from "@/server/services/freeDaysService";

const status = (s: number) => (e: unknown) => e instanceof HttpError && e.status === s;

describe("curadoria", () => {
  let curatorId: string;
  let fem: string[];
  let maleMutant: string;
  let ctp: string;

  beforeEach(async () => {
    await seedBase();
    curatorId = (await createUser("ADMIN", "editor")).id;
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

  it("CTPs 1/2 ficam no personagem: a equipe escolhe o slot e trocar o CTP do slot atualiza todos os dias", async () => {
    const insight = await ctpId("INSIGHT", "NORMAL");
    const base = team(fem);
    const withSlots = (slotOfSolo: 1 | 2, agentCtps: object = {}) =>
      base.members.map((m) => ({ ...m, ctpId: null, ctpSlot: m.slot === "SOLO" ? slotOfSolo : (1 as const), ...(m.slot === "SOLO" ? agentCtps : {}) }));

    const day6 = await saveMetaTeam({ ...base, members: withSlots(2, { agentCtp1Id: ctp, agentCtp2Id: insight }) }, curatorId);
    const solo = day6.members.find((m) => m.slot === "SOLO")!;
    expect(solo).toMatchObject({ ctpSlot: 2, ctpId: insight });
    // Sem CTPs no personagem, o slot 1 fica sem CTP.
    expect(day6.members.find((m) => m.slot === "SUPPORT_1")).toMatchObject({ ctpSlot: 1, ctpId: null });

    const agentId = (await prisma.uniform.findUniqueOrThrow({ where: { id: fem[0] } })).agentId;
    expect(await prisma.agent.findUniqueOrThrow({ where: { id: agentId } })).toMatchObject({ metaCtp1Id: ctp, metaCtp2Id: insight });

    // Outra equipe troca o CTP 2 do personagem: a do dia 6 (slot 2) acompanha.
    const liberation = await ctpId("LIBERATION", "MIGHTY");
    await saveMetaTeam({ ...base, isPrimary: false, members: withSlots(1, { agentCtp2Id: liberation }) }, curatorId);
    const again = await prisma.metaTeamMember.findFirstOrThrow({ where: { metaTeamId: day6.id, slot: "SOLO" } });
    expect(again.ctpId).toBe(liberation);
  });

  it("alternativa nova entra no fim; o ADMIN reordena e a principal segue primeiro", async () => {
    const primary = await saveMetaTeam(team(fem), curatorId);
    const a = await saveMetaTeam({ ...team([fem[1], fem[0], fem[2]]), isPrimary: false, label: "A" }, curatorId);
    const b = await saveMetaTeam({ ...team([fem[2], fem[0], fem[1]]), isPrimary: false, label: "B" }, curatorId);
    const day = await dayId("BAX", 6);
    expect((await listMetaTeams("DAY", day)).map((t) => t.label ?? "P")).toEqual(["P", "A", "B"]);

    await reorderMetaTeams([b.id, a.id]);
    expect((await listMetaTeams("DAY", day)).map((t) => t.label ?? "P")).toEqual(["P", "B", "A"]);
    expect(primary.isPrimary).toBe(true);

    // Equipes de dias diferentes não se misturam.
    const other = await saveMetaTeam({ ...team(fem), number: 13 }, curatorId);
    await expect(reorderMetaTeams([a.id, other.id])).rejects.toSatisfy(status(400));
    await expect(reorderMetaTeams(["naoexiste0000000000000000"])).rejects.toSatisfy(status(404));
  });

  it("o Causador de Dano guarda o Striker meta; quem não é Causador de Dano não tem Striker", async () => {
    const base = team(fem);
    const saved = await saveMetaTeam(
      {
        ...base,
        members: base.members.map((m) => ({ ...m, isDamageDealer: m.slot === "SOLO", strikerUniformId: maleMutant })),
      },
      curatorId,
    );
    expect(Object.fromEntries(saved.members.map((m) => [m.slot, m.strikerUniformId]))).toEqual({
      SOLO: maleMutant,
      SUPPORT_1: null,
      SUPPORT_2: null,
    });
  });

  it("recusa Striker inexistente ou do próprio personagem", async () => {
    const base = team(fem);
    const withStriker = (strikerUniformId: string) => ({
      ...base,
      members: base.members.map((m) => (m.slot === "SOLO" ? { ...m, isDamageDealer: true, strikerUniformId } : m)),
    });
    for (const id of ["nao-existe", fem[0]]) {
      const err = await saveMetaTeam(withStriker(id), curatorId).catch((e) => e);
      expect(err).toBeInstanceOf(HttpError);
      expect(err.status).toBe(400);
    }
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
    expect(a.updatedBy).toBe("admin");
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

  describe("dias sem restrição e BAI sincronizados", () => {
    const free = (number: number, isPrimary = true) => ({
      scope: "DAY" as const,
      mode: "BAL" as const,
      number,
      isPrimary,
      members: (["SOLO", "SUPPORT_1", "SUPPORT_2"] as const).map((slot, i) => ({ slot, uniformId: fem[i], ctpId: ctp })),
    });
    const teamsAt = async (where: object) =>
      (await prisma.metaTeam.findMany({ where, include: { members: true } })).map((t) => [t.isPrimary, t.members.map((m) => m.uniformId).sort()]);

    it("salvar a Meta de um dia livre copia para os outros dias livres e para a BAI, não para dia com restrição", async () => {
      await saveMetaTeam(free(1), curatorId);
      const expected = [[true, [...fem].sort()]];
      expect(await teamsAt({ battleDayId: await dayId("BAX", 2) })).toEqual(expected);
      expect(await teamsAt({ scope: "BAI" })).toEqual(expected);
      expect(await teamsAt({ battleDayId: await dayId("BAX", 6) })).toEqual([]);
    });

    it("excluir e salvar reservas também sincronizam", async () => {
      const team = await saveMetaTeam(free(1), curatorId);
      await savePriority({ scope: "BAI" }, { solo: [{ uniformId: fem[0] }], support: [] });
      expect(await prisma.priorityEntry.count({ where: { battleDayId: await dayId("BAL", 1) } })).toBe(1);
      const baiCopy = await prisma.metaTeam.findFirstOrThrow({ where: { scope: "BAI" } });
      expect(baiCopy.id).not.toBe(team.id);
      await deleteMetaTeam(baiCopy.id);
      expect(await prisma.metaTeam.count({ where: { scope: { in: ["DAY", "BAI"] } } })).toBe(0);
    });

    it("com a sincronização desligada, cada dia livre fica com a sua equipe", async () => {
      await prisma.settings.create({ data: { id: 1, cycleAnchor: new Date("2026-09-24T15:00:00Z") } });
      await setFreeDaysSync(false);
      await saveMetaTeam(free(1), curatorId);
      expect(await prisma.metaTeam.count()).toBe(1);
    });
  });

  describe("usuários", () => {
    it("cria conta com nome de usuário (minúsculo); usuário repetido gera 409", async () => {
      const u = await createAccount({ username: "Sword Menezes", password: "Desenho.2020!", role: "ADMIN" });
      expect(u).toMatchObject({ username: "sword menezes", role: "ADMIN" });
      const row = await prisma.user.findUniqueOrThrow({ where: { id: u.id } });
      expect(row.passwordHash).not.toBe("Desenho.2020!");
      await expect(createAccount({ username: "SWORD MENEZES", password: "Desenho.2020!", role: "USER" })).rejects.toSatisfy(status(409));
    });

    it("a busca acha por usuário ou apelido, sem diferenciar maiúsculas", async () => {
      await createAccount({ username: "tenmenezes", nickname: "Ten Menezes", password: "senha1234", role: "USER" });
      await createAccount({ username: "lider", password: "senha1234", role: "ADMIN" });
      expect((await listUsers({ q: "MENEZES" })).users.map((u) => u.username)).toEqual(["tenmenezes"]);
      expect((await listUsers({ q: "LIDER" })).users.map((u) => u.username)).toEqual(["lider"]);
    });

    it("a mesma pessoa não ganha duas contas: usuário ou apelido escritos de outro jeito geram 409", async () => {
      await createAccount({ username: "sword menezes", nickname: "Sword Menezes", password: "Desenho.2020!", role: "USER" });
      for (const username of ["sword.menezes", "sword_menezes", "swordmenezes", "Sword-Menezes"]) {
        await expect(createAccount({ username, password: "Desenho.2020!", role: "USER" })).rejects.toSatisfy(
          (e) => e instanceof HttpError && e.status === 409 && !!e.fields?.username,
        );
      }
      await expect(createAccount({ username: "outra", nickname: "  swórd.MENEZES ", password: "Desenho.2020!", role: "USER" })).rejects.toSatisfy(
        (e) => e instanceof HttpError && e.status === 409 && !!e.fields?.nickname,
      );
      // Contas sem apelido não colidem entre si.
      await createAccount({ username: "sem apelido 1", password: "Desenho.2020!", role: "USER" });
      await createAccount({ username: "sem apelido 2", password: "Desenho.2020!", role: "USER" });
    });

    it("a lista marca contas antigas que repetem outra (sem a chave de identidade)", async () => {
      await createAccount({ username: "tenmenezes", nickname: "Ten", password: "senha1234", role: "USER" });
      await prisma.user.create({ data: { username: "ten.menezes", passwordHash: "x", role: "USER" } });
      const byName = Object.fromEntries((await listUsers({})).users.map((u) => [u.username, u.duplicate]));
      expect(byName).toMatchObject({ tenmenezes: false, "ten.menezes": true });
    });

    it("excluir a conta (saiu da aliança) apaga os dados dela, mantém as equipes Meta e libera o nome", async () => {
      const u = await createAccount({ username: "saiu", nickname: "Saiu", password: "senha1234", role: "USER" });
      await prisma.userSelectionsDoc.create({ data: { userId: u.id, json: "{}" } });
      await prisma.securityNotice.create({ data: { userId: u.id, type: "NEW_LOGIN" } });
      await prisma.loginAttempt.create({ data: { key: "saiu|10.0.0.1", failedCount: 2 } });
      const team = await createMetaTeam({ scope: "BAI", uniformIds: [fem[0], fem[1], fem[2]], updatedById: u.id });

      await deleteUser(u.id, curatorId);

      expect(await prisma.user.findUnique({ where: { id: u.id } })).toBeNull();
      expect(await prisma.userSelectionsDoc.count({ where: { userId: u.id } })).toBe(0);
      expect(await prisma.securityNotice.count({ where: { userId: u.id } })).toBe(0);
      expect(await prisma.loginAttempt.count()).toBe(0);
      expect(await prisma.metaTeam.findUniqueOrThrow({ where: { id: team.id } })).toMatchObject({ updatedById: null });
      await expect(createAccount({ username: "saiu", nickname: "Saiu", password: "senha1234", role: "USER" })).resolves.toBeTruthy();
    });

    it("ninguém exclui a própria conta; conta inexistente gera 404", async () => {
      await expect(deleteUser(curatorId, curatorId)).rejects.toSatisfy(status(409));
      await expect(deleteUser("nao-existe", curatorId)).rejects.toSatisfy(status(404));
    });

    it("rebaixar o último ADMIN gera 409", async () => {
      // O "editor" do beforeEach é o único ADMIN.
      await expect(changeRole(curatorId, "USER")).rejects.toSatisfy(status(409));
      await createUser("ADMIN", "outro");
      await expect(changeRole(curatorId, "USER")).resolves.toMatchObject({ role: "USER" });
    });
  });
});
