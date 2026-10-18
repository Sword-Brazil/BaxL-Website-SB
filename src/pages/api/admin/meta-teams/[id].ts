import { z } from "zod";
import { MetaTeamSchema } from "@/models/schemas/admin";
import { idSchema } from "@/models/schemas/common";
import { handler, parseBody, parseQuery } from "@/server/http";
import { deleteMetaTeam, saveMetaTeam } from "@/server/services/metaTeamService";
import { requireRole } from "@/server/session";

const Params = z.object({ id: idSchema });

export default handler({
  PUT: async (req, res) => {
    const user = await requireRole(req, res, "CURATOR");
    const { id } = parseQuery(Params, req);
    res.status(200).json(await saveMetaTeam(parseBody(MetaTeamSchema, req), user.id, id));
  },
  DELETE: async (req, res) => {
    await requireRole(req, res, "CURATOR");
    await deleteMetaTeam(parseQuery(Params, req).id);
    res.status(204).end();
  },
});
