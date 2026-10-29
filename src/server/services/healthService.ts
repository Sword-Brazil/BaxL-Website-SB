import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";

type Delegate = { findFirst: (args?: object) => Promise<unknown> };

/**
 * Lê uma linha de cada tabela com todas as colunas do schema: se o banco estiver numa versão
 * diferente da que o código espera, o Prisma falha (tabela ou coluna inexistente) e a rota
 * responde "em manutenção". Nada do que é lido sai daqui.
 */
export async function checkSchema(): Promise<void> {
  const delegates = Object.values(Prisma.ModelName).map(
    (name) => (prisma as unknown as Record<string, Delegate>)[name[0].toLowerCase() + name.slice(1)],
  );
  await Promise.all(delegates.map((d) => d.findFirst()));
}
