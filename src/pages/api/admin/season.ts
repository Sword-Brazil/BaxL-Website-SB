import { SeasonSchema } from "@/models/schemas/admin";
import { handler, parseBody } from "@/server/http";
import { getSeason, setSeason } from "@/server/services/seasonService";
import { requireRole } from "@/server/session";

/** Temporada atual da BA (curadoria): efeito da BAX e da BAL. */
export default handler({
  GET: async (req, res) => {
    await requireRole(req, res, "ADMIN");
    res.status(200).json(await getSeason());
  },
  PUT: async (req, res) => {
    await requireRole(req, res, "ADMIN");
    res.status(200).json(await setSeason(parseBody(SeasonSchema, req)));
  },
});
