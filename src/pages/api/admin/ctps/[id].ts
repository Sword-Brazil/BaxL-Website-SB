import { z } from "zod";
import { CtpInputSchema } from "@/models/schemas/admin";
import { idSchema } from "@/models/schemas/common";
import { handler, parseBody, parseQuery } from "@/server/http";
import { deleteCtp, saveCtp } from "@/server/services/catalogAdminService";
import { requireRole } from "@/server/session";

export default handler({
  PUT: async (req, res) => {
    await requireRole(req, res, "ADMIN");
    const { id } = parseQuery(z.object({ id: idSchema }), req);
    res.status(200).json(await saveCtp(parseBody(CtpInputSchema, req), id));
  },
  DELETE: async (req, res) => {
    await requireRole(req, res, "ADMIN");
    const { id } = parseQuery(z.object({ id: idSchema }), req);
    await deleteCtp(id);
    res.status(204).end();
  },
});
