import { PutSelectionsSchema } from "@/models/schemas/selections";
import { handler, parseBody } from "@/server/http";
import { getSelections, putSelections } from "@/server/services/selectionsService";
import { requireUser } from "@/server/session";

export const config = { api: { bodyParser: { sizeLimit: "1mb" } } };

export default handler({
  GET: async (req, res) => {
    const user = await requireUser(req, res);
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(await getSelections(user.id));
  },
  PUT: async (req, res) => {
    const user = await requireUser(req, res);
    const { selections, baseUpdatedAt } = parseBody(PutSelectionsSchema, req);
    res.status(200).json(await putSelections(user.id, selections, baseUpdatedAt));
  },
});
