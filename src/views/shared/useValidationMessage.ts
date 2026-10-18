import { useTranslation } from "next-i18next/pages";
import { validationCode } from "@/models/schemas/messages";

/** Traduz as mensagens próprias das validações (que vêm em português dos schemas e da API). */
export function useValidationMessage() {
  const { t } = useTranslation("common");
  return (message: string | undefined) => {
    const code = validationCode(message);
    return code ? t(`validation.${code}`) : message;
  };
}
