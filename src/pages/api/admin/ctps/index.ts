import { CtpInputSchema } from "@/models/schemas/admin";
import { handler, parseBody } from "@/server/http";
import { saveCtp } from "@/server/services/catalogAdminService";
import { requireRole } from "@/server/session";

export default handler({
  POST: async (req, res) => {
    await requireRole(req, res, "ADMIN");
    res.status(201).json(await saveCtp(parseBody(CtpInputSchema, req)));
  },
});
