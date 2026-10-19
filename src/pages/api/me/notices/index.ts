import { randomUUID } from "node:crypto";
import { handler } from "@/server/http";
import { listNotices } from "@/server/services/notificationService";
import { getSession, requireUser } from "@/server/session";

export default handler({
  GET: async (req, res) => {
    const user = await requireUser(req, res);
    const session = await getSession(req, res);
    // Sessões de antes dos avisos: passam a ter identificação a partir de agora.
    if (!session.sid) {
      session.sid = randomUUID();
      session.loginAt = new Date().toISOString();
      await session.save();
    }
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(await listNotices(user.id, session));
  },
});
