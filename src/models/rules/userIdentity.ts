/**
 * Chave de identidade de um nome (usuário ou apelido no jogo), para achar contas repetidas: sem
 * acentos, minúsculas, só letras e números. "Sword.Menezes", "sword menezes" e "sword_menezes"
 * são a mesma pessoa. Vazio (só símbolos) = sem chave.
 */
export function identityKey(name: string | null | undefined): string | null {
  const key = (name ?? "")
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, "");
  return key || null;
}
