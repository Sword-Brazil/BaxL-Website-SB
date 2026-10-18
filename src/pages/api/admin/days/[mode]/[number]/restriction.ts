import { z } from "zod";
import { RestrictionSchema } from "@/models/schemas/admin";
import { dayModeSchema, dayNumberParamSchema } from "@/models/schemas/common";
import { handler, parseBody, parseQuery } from "@/server/http";
import { setRestriction } from "@/server/services/restrictionService";
import { requireRole } from "@/server/session";

const Params = z.object({ mode: dayModeSchema, number: dayNumberParamSchema });

export default handler({
  PUT: async (req, res) => {
    await requireRole(req, res, "CURATOR");
    const { mode, number } = parseQuery(Params, req);
    const { criteria } = parseBody(RestrictionSchema, req);
    res.status(200).json({ criteria: await setRestriction(mode, number, criteria) });
  },
});
