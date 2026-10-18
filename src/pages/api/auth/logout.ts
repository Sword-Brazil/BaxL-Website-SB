import { handler } from "@/server/http";
import { getSession } from "@/server/session";

export default handler({
  POST: async (req, res) => {
    const session = await getSession(req, res);
    session.destroy();
    res.status(204).end();
  },
});
