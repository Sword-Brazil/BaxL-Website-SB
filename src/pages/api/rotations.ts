import { handler } from "@/server/http";
import { listRotations } from "@/server/services/rotationService";

/** Rotações dos personagens (público). */
export default handler({
  GET: async (_req, res) => {
    // Como no catálogo: sempre revalida, para uma edição no admin aparecer na hora.
    res.setHeader("Cache-Control", "no-cache");
    res.status(200).json(await listRotations());
  },
});
