import { handler } from "@/server/http";
import { getCatalog } from "@/server/services/catalogService";
import { requireUser } from "@/server/session";

export default handler({
  GET: async (req, res) => {
    await requireUser(req, res); // site privado: só membros logados
    // Sempre revalida (a ETag devolve 304 se nada mudou). Com stale-while-revalidate o navegador
    // mostrava o catálogo antigo por até 1h depois de uma edição no admin.
    res.setHeader("Cache-Control", "no-cache");
    res.status(200).json(await getCatalog());
  },
});
