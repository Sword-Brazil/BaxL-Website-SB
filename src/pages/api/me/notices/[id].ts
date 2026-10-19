import { z } from "zod";
import { idSchema } from "@/models/schemas/common";
import { handler, parseQuery } from "@/server/http";
import { dismissNotice } from "@/server/services/notificationService";
import { requireUser } from "@/server/session";

/** Dispensar um aviso persistente. */
export default handler({
  DELETE: async (req, res) => {
    const user = await requireUser(req, res);
    const { id } = parseQuery(z.object({ id: idSchema }), req);
    await dismissNotice(user.id, id);
    res.status(204).end();
  },
});
