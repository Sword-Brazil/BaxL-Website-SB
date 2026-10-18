import { z } from "zod";
import { dayModeSchema } from "@/models/schemas/common";
import { handler, HttpError } from "@/server/http";
import { getDay } from "@/server/services/daysService";

const QuerySchema = z.object({ mode: dayModeSchema, number: z.coerce.number().int() });

export default handler({
  GET: async (req, res) => {
    const parsed = QuerySchema.safeParse(req.query);
    if (!parsed.success) throw new HttpError(404, "NOT_FOUND", "Dia não encontrado");
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(await getDay(parsed.data.mode, parsed.data.number));
  },
});
