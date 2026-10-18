import { ResetPasswordSchema } from "@/models/schemas/auth";
import { handler, parseBody } from "@/server/http";
import { resetPassword } from "@/server/services/authService";

export default handler({
  POST: async (req, res) => {
    const { token, password } = parseBody(ResetPasswordSchema, req);
    res.status(200).json(await resetPassword(token, password));
  },
});
