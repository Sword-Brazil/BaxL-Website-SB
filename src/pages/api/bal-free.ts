import { handler } from "@/server/http";
import { listBalFree } from "@/server/services/daysService";

export default handler({
  GET: async (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(await listBalFree());
  },
});
