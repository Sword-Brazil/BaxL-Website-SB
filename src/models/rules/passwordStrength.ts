// Força da senha: as mesmas regras do passwordSchema (obrigatórias) + bônus de tamanho e
// penalidade para padrões fáceis de adivinhar. Usado no medidor dos campos de senha.

export const PASSWORD_RULES = {
  length: (p: string) => p.length >= 8,
  lower: (p: string) => /[a-z]/.test(p),
  upper: (p: string) => /[A-Z]/.test(p),
  digit: (p: string) => /\d/.test(p),
  symbol: (p: string) => /[^A-Za-z0-9]/.test(p),
} as const;
export type PasswordRule = keyof typeof PASSWORD_RULES;

/** 0 = vazia, 1 = fraca, 2 = razoável, 3 = boa (cumpre todas as regras), 4 = forte. */
export type StrengthLevel = 0 | 1 | 2 | 3 | 4;

const COMMON = /(senha|password|qwerty|abc123|123456|admin|sword|marvel)/i;
const REPEATED = /(.)\1{2,}/;
const SEQUENCE = /(0123|1234|2345|3456|4567|5678|6789|abcd|bcde|cdef)/i;

export function passwordStrength(password: string): { level: StrengthLevel; passed: Record<PasswordRule, boolean>; valid: boolean } {
  const passed = Object.fromEntries(Object.entries(PASSWORD_RULES).map(([rule, test]) => [rule, test(password)])) as Record<PasswordRule, boolean>;
  const valid = Object.values(passed).every(Boolean);
  if (!password) return { level: 0, passed, valid };
  let points = Object.values(passed).filter(Boolean).length + (password.length >= 12 ? 1 : 0);
  if (COMMON.test(password) || REPEATED.test(password) || SEQUENCE.test(password)) points -= 1;
  // Só é "boa" se cumprir todas as regras obrigatórias.
  const level: StrengthLevel = !valid ? (points <= 2 ? 1 : 2) : points >= 6 ? 4 : 3;
  return { level, passed, valid };
}
