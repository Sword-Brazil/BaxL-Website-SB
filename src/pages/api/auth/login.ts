import { randomUUID } from "node:crypto";
import { LoginSchema } from "@/models/schemas/auth";
import { clientIp, handler, parseBody } from "@/server/http";
import { login } from "@/server/services/authService";
import { getSession } from "@/server/session";
import { SHORT_SESSION_MS, sessionOptions, shortSessionOptions } from "@/server/sessionOptions";

export default handler({
  POST: async (req, res) => {
    const { username, password, remember } = parseBody(LoginSchema, req);
    const sid = randomUUID();
    const user = await login({ username, password, ip: clientIp(req), sessionId: sid });
    const session = await getSession(req, res);
    session.userId = user.id;
    session.sid = sid;
    session.loginAt = new Date().toISOString();
    // "Manter logado": cookie de 30 dias. Sem ele: cookie de sessão, que vale até fechar o
    // navegador (e no máximo 12 h), então o site volta a pedir o login.
    session.remember = remember;
    if (remember) {
      delete session.expiresAt;
      session.updateConfig(sessionOptions());
    } else {
      session.expiresAt = Date.now() + SHORT_SESSION_MS;
      session.updateConfig(shortSessionOptions());
    }
    await session.save();
    res.status(200).json(user);
  },
});
