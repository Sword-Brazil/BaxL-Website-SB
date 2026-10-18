import { BaiBossesSchema } from "@/models/schemas/admin";
import { handler, parseBody } from "@/server/http";
import { listBosses, saveBosses } from "@/server/services/baiService";
import { requireRole } from "@/server/session";

export default handler({
  GET: async (req, res) => {
    await requireRole(req, res, "CURATOR");
    res.status(200).json(await listBosses());
  },
  PUT: async (req, res) => {
    await requireRole(req, res, "CURATOR");
    res.status(200).json(await saveBosses(parseBody(BaiBossesSchema, req)));
  },
});
