import { randomUUID } from "node:crypto";
import { LoginSchema } from "@/models/schemas/auth";
import { clientIp, handler, parseBody } from "@/server/http";
import { login } from "@/server/services/authService";
import { getSession } from "@/server/session";

export default handler({
  POST: async (req, res) => {
    const { username, password } = parseBody(LoginSchema, req);
    const sid = randomUUID();
    const user = await login({ username, password, ip: clientIp(req), sessionId: sid });
    const session = await getSession(req, res);
    session.userId = user.id;
    session.sid = sid;
    session.loginAt = new Date().toISOString();
    await session.save();
    res.status(200).json(user);
  },
});
