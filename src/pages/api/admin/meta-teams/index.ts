import { z } from "zod";
import { MetaTeamSchema } from "@/models/schemas/admin";
import { dayModeSchema, dayNumberParamSchema, teamScopeSchema } from "@/models/schemas/common";
import { handler, parseBody, parseQuery } from "@/server/http";
import { findBattleDay } from "@/server/services/curationGuards";
import { listMetaTeams, saveMetaTeam } from "@/server/services/metaTeamService";
import { requireRole } from "@/server/session";

const ListQuery = z.object({
  scope: teamScopeSchema,
  mode: dayModeSchema.optional(),
  number: dayNumberParamSchema.optional(),
});

export default handler({
  GET: async (req, res) => {
    await requireRole(req, res, "CURATOR");
    const q = parseQuery(ListQuery, req);
    const battleDayId = q.scope === "DAY" && q.mode && q.number ? (await findBattleDay(q.mode, q.number)).id : null;
    res.status(200).json(await listMetaTeams(q.scope, battleDayId));
  },
  POST: async (req, res) => {
    const user = await requireRole(req, res, "CURATOR");
    res.status(201).json(await saveMetaTeam(parseBody(MetaTeamSchema, req), user.id));
  },
});
