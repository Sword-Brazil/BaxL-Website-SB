import { handler } from "@/server/http";
import { getCatalog } from "@/server/services/catalogService";

export default handler({
  GET: async (_req, res) => {
    // Sempre revalida (a ETag devolve 304 se nada mudou). Com stale-while-revalidate o navegador
    // mostrava o catálogo antigo por até 1h depois de uma edição no admin.
    res.setHeader("Cache-Control", "no-cache");
    res.status(200).json(await getCatalog());
  },
});
