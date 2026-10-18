import { getBattleClock } from "@/models/rules/battleClock";
import { handler } from "@/server/http";
import { getSettings } from "@/server/services/settingsService";

export default handler({
  GET: async (_req, res) => {
    const settings = await getSettings();
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json({ clock: getBattleClock(new Date(), settings), settings });
  },
});
