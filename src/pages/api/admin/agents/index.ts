import { AgentSchema } from "@/models/schemas/admin";
import { handler, parseBody } from "@/server/http";
import { createAgent } from "@/server/services/catalogAdminService";
import { requireRole } from "@/server/session";

export default handler({
  POST: async (req, res) => {
    await requireRole(req, res, "CURATOR");
    res.status(201).json(await createAgent(parseBody(AgentSchema, req)));
  },
});
