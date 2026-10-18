import { PrioritySchema, PriorityTargetSchema } from "@/models/schemas/admin";
import { handler, parse, parseBody } from "@/server/http";
import { getPriority, savePriority } from "@/server/services/priorityService";
import { requireRole } from "@/server/session";
import type { NextApiRequest } from "next";

/** /api/admin/priority/BAI  ou  /api/admin/priority/DAY/BAX/4 */
function target(req: NextApiRequest) {
  const [scope, mode, number] = ([] as string[]).concat(req.query.params ?? []);
  return parse(PriorityTargetSchema, scope === "DAY" ? { scope, mode, number: Number(number) } : { scope });
}

export default handler({
  GET: async (req, res) => {
    await requireRole(req, res, "CURATOR");
    res.status(200).json(await getPriority(target(req)));
  },
  PUT: async (req, res) => {
    await requireRole(req, res, "CURATOR");
    res.status(200).json(await savePriority(target(req), parseBody(PrioritySchema, req)));
  },
});
