import { RegisterSchema } from "@/models/schemas/auth";
import { handler, parseBody } from "@/server/http";
import { register } from "@/server/services/authService";

export default handler({
  POST: async (req, res) => {
    res.status(201).json(await register(parseBody(RegisterSchema, req)));
  },
});
