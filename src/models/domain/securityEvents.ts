// Catálogo único dos eventos de segurança (FN-002): cada tipo tem gravidade fixa e a gravidade
// decide os canais. Telas e serviços chamam `notify(evento)` e nunca escolhem o canal.

export const SEVERITIES = ["INFO", "ATTENTION", "CRITICAL"] as const;
export type Severity = (typeof SEVERITIES)[number];

/** toast = efêmero na sessão atual; banner = aviso persistente na tela; email = fora do app. */
export const CHANNELS = ["toast", "banner", "email"] as const;
export type Channel = (typeof CHANNELS)[number];

export const SECURITY_EVENTS = {
  // Informativo → toast (só no cliente)
  SESSION_EXPIRED: "INFO",
  // Atenção → aviso persistente (contas da curadoria; jogadores não têm conta)
  NEW_LOGIN: "ATTENTION",
  FAILED_LOGINS: "ATTENTION",
  // Crítico → e-mail + aviso persistente
  PASSWORD_RESET: "CRITICAL",
  ROLE_CHANGED: "CRITICAL",
  ACCOUNT_LOCKED: "CRITICAL",
} as const satisfies Record<string, Severity>;

export type SecurityEventType = keyof typeof SECURITY_EVENTS;

/** Eventos que viram aviso persistente (gravados pelo servidor). */
export type NoticeEventType = { [K in SecurityEventType]: (typeof SECURITY_EVENTS)[K] extends "INFO" ? never : K }[SecurityEventType];
/** Eventos só de toast (disparados pelo cliente). */
export type InfoEventType = Exclude<SecurityEventType, NoticeEventType>;
/** Eventos que também saem por e-mail. */
export type CriticalEventType = { [K in SecurityEventType]: (typeof SECURITY_EVENTS)[K] extends "CRITICAL" ? K : never }[SecurityEventType];

const CHANNELS_BY_SEVERITY: Record<Severity, readonly Channel[]> = {
  INFO: ["toast"],
  ATTENTION: ["banner"],
  CRITICAL: ["email", "banner"],
};

export const severityOf = (type: SecurityEventType): Severity => SECURITY_EVENTS[type];

export const channelsOf = (type: SecurityEventType): readonly Channel[] => CHANNELS_BY_SEVERITY[severityOf(type)];

export const isNoticeEvent = (type: string): type is NoticeEventType =>
  type in SECURITY_EVENTS && channelsOf(type as SecurityEventType).includes("banner");

/** Parâmetros (não sensíveis) que acompanham alguns avisos. */
export interface NoticeParams {
  role?: string;
}

/** Aviso persistente como chega à interface. */
export interface SecurityNotice {
  id: string;
  type: NoticeEventType;
  severity: Exclude<Severity, "INFO">;
  params: NoticeParams;
  createdAt: string;
}
