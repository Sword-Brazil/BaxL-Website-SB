import { getBattleClock } from "@/models/rules/battleClock";
import { handler } from "@/server/http";
import { getSeason } from "@/server/services/seasonService";
import { getSettings } from "@/server/services/settingsService";
import { requireUser } from "@/server/session";

export default handler({
  GET: async (req, res) => {
    await requireUser(req, res); // site privado: só membros logados
    const [settings, season] = await Promise.all([getSettings(), getSeason()]);
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json({ clock: getBattleClock(new Date(), settings), settings, season });
  },
});
