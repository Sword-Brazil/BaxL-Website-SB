import { handler } from "@/server/http";
import { getCatalog } from "@/server/services/catalogService";

export default handler({
  GET: async (_req, res) => {
    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=3600");
    res.status(200).json(await getCatalog());
  },
});
