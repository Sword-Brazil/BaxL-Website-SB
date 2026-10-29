import { handler } from "@/server/http";
import { checkSchema } from "@/server/services/healthService";

/**
 * Banco acessível e na versão que o código espera? Pública (a tela de manutenção também aparece
 * para quem não entrou) e sem dados: só 204, ou o erro padrão (503 MAINTENANCE / 503 sem banco).
 */
export default handler({
  GET: async (_req, res) => {
    await checkSchema();
    res.setHeader("Cache-Control", "no-store");
    res.status(204).end();
  },
});
