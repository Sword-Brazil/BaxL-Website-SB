import { z } from "zod";
import { dayModeSchema } from "@/models/schemas/common";
import { handler, parseQuery } from "@/server/http";
import { listDays } from "@/server/services/daysService";
import { requireUser } from "@/server/session";

const QuerySchema = z.object({ mode: dayModeSchema });

export default handler({
  GET: async (req, res) => {
    await requireUser(req, res); // site privado: só membros logados
    const { mode } = parseQuery(QuerySchema, req);
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(await listDays(mode));
  },
});
