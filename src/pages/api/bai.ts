import { handler } from "@/server/http";
import { getPublicBai } from "@/server/services/baiService";
import { requireUser } from "@/server/session";

export default handler({
  GET: async (req, res) => {
    await requireUser(req, res); // site privado: só membros logados
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(await getPublicBai());
  },
});
