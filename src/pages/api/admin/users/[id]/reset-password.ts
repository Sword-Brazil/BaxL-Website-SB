import { z } from "zod";
import { AdminResetPasswordSchema } from "@/models/schemas/admin";
import { idSchema } from "@/models/schemas/common";
import { handler, parseBody, parseQuery } from "@/server/http";
import { adminResetPassword } from "@/server/services/usersService";
import { requireRole } from "@/server/session";

export default handler({
  POST: async (req, res) => {
    await requireRole(req, res, "ADMIN");
    const { id } = parseQuery(z.object({ id: idSchema }), req);
    await adminResetPassword(id, parseBody(AdminResetPasswordSchema, req).password);
    res.status(204).end();
  },
});
