import { LoginSchema } from "@/models/schemas/auth";
import { clientIp, handler, parseBody } from "@/server/http";
import { login } from "@/server/services/authService";
import { getSession } from "@/server/session";

export default handler({
  POST: async (req, res) => {
    const { email, password } = parseBody(LoginSchema, req);
    const user = await login({ email, password, ip: clientIp(req) });
    const session = await getSession(req, res);
    session.userId = user.id;
    await session.save();
    res.status(200).json(user);
  },
});
