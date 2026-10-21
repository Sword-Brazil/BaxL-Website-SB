import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";

export const userRepository = {
  /** Conta pelo login: com "@" é e-mail (curadoria), sem é nome de usuário (jogadores). */
  findByLogin: (login: string) => prisma.user.findUnique({ where: login.includes("@") ? { email: login } : { username: login } }),
  findById: (id: string) => prisma.user.findUnique({ where: { id } }),

  getAttempt: (key: string) => prisma.loginAttempt.findUnique({ where: { key } }),
  /**
   * Registra uma falha de login de forma atômica (compare-and-swap): só grava se o registro ainda
   * estiver como foi lido; senão relê e tenta de novo. Falhas simultâneas nunca se perdem, então
   * não dá para escapar do bloqueio disparando tentativas em paralelo.
   */
  recordFailure: async (
    key: string,
    now: Date,
    rules: { windowMs: number; maxFailures: number; lockMs: number },
  ): Promise<{ failedCount: number; lockedUntil: Date | null }> => {
    for (let attempt = 0; attempt < 50; attempt++) {
      const current = await prisma.loginAttempt.findUnique({ where: { key } });
      const windowOpen = !!current?.firstFailAt && now.getTime() - current.firstFailAt.getTime() < rules.windowMs;
      const failedCount = windowOpen ? current!.failedCount + 1 : 1;
      const data = {
        failedCount,
        firstFailAt: windowOpen ? current!.firstFailAt! : now,
        lockedUntil: failedCount >= rules.maxFailures ? new Date(now.getTime() + rules.lockMs) : null,
      };
      if (!current) {
        try {
          await prisma.loginAttempt.create({ data: { key, ...data } });
          return data;
        } catch (e) {
          if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") continue; // outra criou antes
          throw e;
        }
      }
      const { count } = await prisma.loginAttempt.updateMany({
        where: { key, failedCount: current.failedCount, firstFailAt: current.firstFailAt },
        data,
      });
      if (count === 1) return data;
    }
    throw new Error("Não foi possível registrar a tentativa de login");
  },
  clearAttempt: (key: string) => prisma.loginAttempt.deleteMany({ where: { key } }),
};
