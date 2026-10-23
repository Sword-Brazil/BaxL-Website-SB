import { z } from "zod";
import { idSchema } from "@/models/schemas/common";
import { handler, parseQuery } from "@/server/http";
import { deleteUser } from "@/server/services/usersService";
import { requireRole } from "@/server/session";

export default handler({
  DELETE: async (req, res) => {
    const admin = await requireRole(req, res, "ADMIN");
    const { id } = parseQuery(z.object({ id: idSchema }), req);
    await deleteUser(id, admin.id);
    res.status(204).end();
  },
});
