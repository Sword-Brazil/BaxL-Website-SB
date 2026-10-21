import { z } from "zod";
import { AgentRotationsSchema } from "@/models/schemas/admin";
import { idSchema } from "@/models/schemas/common";
import { handler, parseBody, parseQuery } from "@/server/http";
import { saveAgentRotations } from "@/server/services/rotationService";
import { requireRole } from "@/server/session";

/** Substitui as rotações do personagem (curadoria). */
export default handler({
  PUT: async (req, res) => {
    await requireRole(req, res, "CURATOR");
    const { id } = parseQuery(z.object({ id: idSchema }), req);
    res.status(200).json(await saveAgentRotations(id, parseBody(AgentRotationsSchema, req)));
  },
});
