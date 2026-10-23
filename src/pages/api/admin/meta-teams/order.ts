import { ReorderMetaTeamsSchema } from "@/models/schemas/admin";
import { handler, parseBody } from "@/server/http";
import { reorderMetaTeams } from "@/server/services/metaTeamService";
import { requireRole } from "@/server/session";

export default handler({
  PUT: async (req, res) => {
    await requireRole(req, res, "ADMIN");
    await reorderMetaTeams(parseBody(ReorderMetaTeamsSchema, req).ids);
    res.status(204).end();
  },
});
