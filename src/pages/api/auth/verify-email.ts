import { TokenSchema } from "@/models/schemas/auth";
import { handler, parseBody } from "@/server/http";
import { verifyEmail } from "@/server/services/authService";

export default handler({
  POST: async (req, res) => {
    res.status(200).json(await verifyEmail(parseBody(TokenSchema, req).token));
  },
});
