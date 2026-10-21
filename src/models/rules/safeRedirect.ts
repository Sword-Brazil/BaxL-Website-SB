/**
 * Destino seguro depois do login (`?next=`): só caminhos deste site. Recusa `//outro.site` e
 * `/\outro.site` (o navegador trata como endereço de outro domínio), esquemas e caracteres de
 * controle, para o link de login não virar porta de phishing.
 */
export function safeNextPath(next: unknown): string | null {
  if (typeof next !== "string" || next.length > 512) return null;
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return null;
  if (/[\u0000-\u001f\u007f]/.test(next) || next.includes("\\")) return null;
  return next;
}
