import { handler } from "@/server/http";
import { getSessionUser } from "@/server/session";

export default handler({
  GET: async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(await getSessionUser(req, res));
  },
});
