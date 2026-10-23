import { z } from "zod";
import { handler, parseQuery } from "@/server/http";
import { getAdminGuide } from "@/server/services/adminGuideService";
import { requireRole } from "@/server/session";

/** Seção da Administração no guia (página Sobre): só administradores. */
export default handler({
  GET: async (req, res) => {
    await requireRole(req, res, "ADMIN");
    const { locale } = parseQuery(z.object({ locale: z.string().max(10).optional() }), req);
    res.setHeader("Cache-Control", "private, no-store");
    res.status(200).json(await getAdminGuide(locale ?? "pt-BR"));
  },
});
