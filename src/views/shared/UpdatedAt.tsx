import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import { BRT_TIME_ZONE } from "@/models/rules/battleClock";

/** Data da última atualização no formato do idioma, em horário de Brasília. */
export function UpdatedAt({ iso }: { iso: string | null | undefined }) {
  const { t } = useTranslation("common");
  const { locale } = useRouter();
  if (!iso) return null;
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "short", timeStyle: "short", timeZone: BRT_TIME_ZONE }).format(
    new Date(iso),
  );
  return (
    <time dateTime={iso} className="text-xs text-muted-foreground">
      {t("team.updatedAt", { date })}
    </time>
  );
}
