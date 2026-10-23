import { z } from "zod";
import { handler, parseBody } from "@/server/http";
import { getFreeDaysSync, setFreeDaysSync } from "@/server/services/freeDaysService";
import { requireRole } from "@/server/session";

/** Dias sem restrição e BAI sincronizados (curadoria): liga ou desliga a cópia automática. */
export default handler({
  GET: async (req, res) => {
    await requireRole(req, res, "ADMIN");
    res.status(200).json(await getFreeDaysSync());
  },
  PUT: async (req, res) => {
    await requireRole(req, res, "ADMIN");
    res.status(200).json(await setFreeDaysSync(parseBody(z.object({ sync: z.boolean() }), req).sync));
  },
});
