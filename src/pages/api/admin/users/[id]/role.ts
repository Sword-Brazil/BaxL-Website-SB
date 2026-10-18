import { z } from "zod";
import { ChangeRoleSchema } from "@/models/schemas/admin";
import { idSchema } from "@/models/schemas/common";
import { handler, parseBody, parseQuery } from "@/server/http";
import { changeRole } from "@/server/services/usersService";
import { requireRole } from "@/server/session";

export default handler({
  PATCH: async (req, res) => {
    await requireRole(req, res, "ADMIN");
    const { id } = parseQuery(z.object({ id: idSchema }), req);
    res.status(200).json(await changeRole(id, parseBody(ChangeRoleSchema, req).role));
  },
});
