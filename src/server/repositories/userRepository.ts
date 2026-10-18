import { prisma } from "@/server/db";

export const userRepository = {
  findByEmail: (email: string) => prisma.user.findUnique({ where: { email } }),
  findById: (id: string) => prisma.user.findUnique({ where: { id } }),

  getAttempt: (key: string) => prisma.loginAttempt.findUnique({ where: { key } }),
  saveAttempt: (key: string, data: { failedCount: number; firstFailAt: Date; lockedUntil: Date | null }) =>
    prisma.loginAttempt.upsert({ where: { key }, update: data, create: { key, ...data } }),
  clearAttempt: (key: string) => prisma.loginAttempt.deleteMany({ where: { key } }),
};
