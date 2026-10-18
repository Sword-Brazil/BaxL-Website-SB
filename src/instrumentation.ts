// Executado uma vez ao iniciar o servidor Next.js: falha cedo, com mensagem clara,
// se a configuração obrigatória estiver ausente.
export function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.NEXT_PHASE === "phase-production-build") return;
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET ausente ou com menos de 32 caracteres. Defina-o em .env.local " +
        "(gere com: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\").",
    );
  }
}
