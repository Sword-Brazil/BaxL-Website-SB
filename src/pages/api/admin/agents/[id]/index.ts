import { z } from "zod";
import { AgentSchema } from "@/models/schemas/admin";
import { idSchema } from "@/models/schemas/common";
import { handler, parseBody, parseQuery } from "@/server/http";
import { updateAgent } from "@/server/services/catalogAdminService";
import { requireRole } from "@/server/session";

export default handler({
  PUT: async (req, res) => {
    await requireRole(req, res, "CURATOR");
    const { id } = parseQuery(z.object({ id: idSchema }), req);
    res.status(200).json(await updateAgent(id, parseBody(AgentSchema, req)));
  },
});
