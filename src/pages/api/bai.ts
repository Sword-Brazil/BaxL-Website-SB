import { handler } from "@/server/http";
import { getPublicBai } from "@/server/services/baiService";

export default handler({
  GET: async (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(await getPublicBai());
  },
});
