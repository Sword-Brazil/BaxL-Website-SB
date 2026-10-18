import { ForgotPasswordSchema } from "@/models/schemas/auth";
import { handler, parseBody } from "@/server/http";
import { forgotPassword } from "@/server/services/authService";

export default handler({
  POST: async (req, res) => {
    res.status(200).json(await forgotPassword(parseBody(ForgotPasswordSchema, req).email));
  },
});
