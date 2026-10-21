import { handler } from "@/server/http";
import { listRotations } from "@/server/services/rotationService";
import { requireUser } from "@/server/session";

/** Rotações dos personagens (público). */
export default handler({
  GET: async (req, res) => {
    await requireUser(req, res); // site privado: só membros logados
    // Como no catálogo: sempre revalida, para uma edição no admin aparecer na hora.
    res.setHeader("Cache-Control", "no-cache");
    res.status(200).json(await listRotations());
  },
});
