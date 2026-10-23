import { z } from "zod";
import { handler, parseQuery } from "@/server/http";
import { readAdminGuideImage } from "@/server/services/adminGuideService";
import { requireRole } from "@/server/session";

/** Print do guia da Administração: só administradores (as imagens não ficam em public/). */
export default handler({
  GET: async (req, res) => {
    await requireRole(req, res, "ADMIN");
    const { name } = parseQuery(z.object({ name: z.string().max(60) }), req);
    const image = await readAdminGuideImage(name);
    res.setHeader("Content-Type", "image/jpeg");
    // "private": nenhum cache compartilhado (CDN) guarda a imagem.
    res.setHeader("Cache-Control", "private, max-age=3600");
    res.status(200).send(image);
  },
});
