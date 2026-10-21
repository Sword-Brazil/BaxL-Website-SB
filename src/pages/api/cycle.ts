import { handler } from "@/server/http";
import { getCycle } from "@/server/services/cycleService";
import { requireUser } from "@/server/session";

export default handler({
  GET: async (req, res) => {
    await requireUser(req, res); // site privado: só membros logados
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(await getCycle());
  },
});
