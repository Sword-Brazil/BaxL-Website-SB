export type MailKind = "VERIFY_EMAIL" | "RESET_PASSWORD";

export interface MailService {
  send(to: string, kind: MailKind, link: string): Promise<void>;
}

/**
 * Sem serviço de e-mail no modo local: os links aparecem no log do servidor.
 * Envio real (ex.: nodemailer + SMTP) depende de autorização e de hospedagem.
 */
export class ConsoleMailService implements MailService {
  async send(to: string, kind: MailKind, link: string) {
    console.info(`\n✉  [${kind}] para ${to}\n   ${link}\n`);
  }
}

let current: MailService = new ConsoleMailService();

export const getMailService = () => current;

/** Permite trocar a implementação (testes ou futuro envio real). */
export const setMailService = (service: MailService) => {
  current = service;
};
