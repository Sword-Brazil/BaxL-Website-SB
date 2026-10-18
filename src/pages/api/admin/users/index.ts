import { z } from "zod";
import { CreateStaffSchema } from "@/models/schemas/admin";
import { handler, parseBody, parseQuery } from "@/server/http";
import { createStaff, listUsers } from "@/server/services/usersService";
import { requireRole } from "@/server/session";

const Query = z.object({ q: z.string().trim().max(80).optional(), page: z.coerce.number().int().min(1).optional() });

export default handler({
  GET: async (req, res) => {
    await requireRole(req, res, "ADMIN");
    res.status(200).json(await listUsers(parseQuery(Query, req)));
  },
  POST: async (req, res) => {
    await requireRole(req, res, "ADMIN");
    res.status(201).json(await createStaff(parseBody(CreateStaffSchema, req)));
  },
});
