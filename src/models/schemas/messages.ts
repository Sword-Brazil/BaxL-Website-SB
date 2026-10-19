/**
 * Mensagens próprias das validações (português: é o que a API responde). A interface traduz
 * pelo código (common.json → validation.<código>), ver useValidationMessage.
 */
export const VALIDATION = {
  passwordRequired: "Informe a senha",
  emailInvalid: "E-mail inválido",
  passwordMin: "Mínimo de 8 caracteres",
  passwordLetter: "Precisa conter uma letra",
  passwordDigit: "Precisa conter um número",
  baiDay: "Dia reservado à BAI",
  teamKey: "Chave de equipe inválida",
  sameAgentTwoSlots: "O mesmo agente não pode ocupar dois slots",
  attributeValue: "Valor inválido para o atributo",
  attributeRepeated: "Atributo repetido",
  teamSize: "A equipe precisa de exatamente 3 membros",
  slotsRepeated: "Slots repetidos",
  agentRepeated: "Agente repetido",
  dayRequired: "Dia obrigatório para equipes de dia",
  uniformRepeatedInList: "Uniforme repetido na lista",
  positionRepeated: "Posição repetida",
  slugFormat: "Use kebab-case (ex.: scarlet-witch)",
  uniformRequired: "Cadastre ao menos um uniforme",
  uniformRepeated: "Uniforme repetido",
  rotationFormat: "Rotação inválida: use 1–6 com c, dc ou qc e ( ) para trechos opcionais",
} as const;

export type ValidationCode = keyof typeof VALIDATION;

const BY_MESSAGE = new Map(Object.entries(VALIDATION).map(([code, message]) => [message as string, code as ValidationCode]));

/** Código de uma mensagem própria (undefined para mensagens padrão do Zod ou da API). */
export const validationCode = (message: string | undefined) => (message ? BY_MESSAGE.get(message) : undefined);
