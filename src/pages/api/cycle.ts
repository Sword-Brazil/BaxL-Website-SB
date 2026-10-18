import { handler } from "@/server/http";
import { getCycle } from "@/server/services/cycleService";

export default handler({
  GET: async (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(await getCycle());
  },
});
