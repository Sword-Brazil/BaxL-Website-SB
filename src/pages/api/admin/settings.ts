import { SettingsSchema } from "@/models/schemas/admin";
import { handler, parseBody } from "@/server/http";
import { getSettings, updateSettings } from "@/server/services/settingsService";
import { requireRole } from "@/server/session";

export default handler({
  GET: async (req, res) => {
    await requireRole(req, res, "ADMIN");
    res.status(200).json(await getSettings());
  },
  PUT: async (req, res) => {
    await requireRole(req, res, "ADMIN");
    res.status(200).json(await updateSettings(parseBody(SettingsSchema, req)));
  },
});
