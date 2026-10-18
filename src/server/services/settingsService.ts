import type { Settings } from "@/models/domain/types";
import { prisma } from "@/server/db";
import { HttpError } from "@/server/http";

export async function getSettings(): Promise<Settings> {
  const s = await prisma.settings.findUnique({ where: { id: 1 } });
  if (!s) throw new HttpError(500, "INTERNAL_ERROR", "Settings ausente: rode `npx prisma db seed`");
  return {
    cycleAnchor: s.cycleAnchor.toISOString(),
    dayTurnoverHour: s.dayTurnoverHour,
    weeklyResetHour: s.weeklyResetHour,
    baiWeekday: s.baiWeekday,
  };
}

export async function updateSettings(input: { cycleAnchor: string; dayTurnoverHour: number; weeklyResetHour: number }) {
  await prisma.settings.update({
    where: { id: 1 },
    data: {
      cycleAnchor: new Date(input.cycleAnchor),
      dayTurnoverHour: input.dayTurnoverHour,
      weeklyResetHour: input.weeklyResetHour,
    },
  });
  return getSettings();
}
