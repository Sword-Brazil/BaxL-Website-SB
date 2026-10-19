import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import { MailWarningIcon, ShieldAlertIcon, TriangleAlertIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { SecurityNotice } from "@/models/domain/securityEvents";
import { BRT_TIME_ZONE } from "@/models/rules/battleClock";
import { useSecurityNoticesViewModel } from "@/viewmodels/useSecurityNoticesViewModel";

/** Avisos em que faz sentido oferecer "não foi você?" (leva à recuperação de senha). */
const OFFER_RESET = new Set<SecurityNotice["type"]>(["NEW_LOGIN", "FAILED_LOGINS", "PASSWORD_RESET", "ACCOUNT_LOCKED"]);

function NoticeItem({ notice, onDismiss }: { notice: SecurityNotice; onDismiss: () => void }) {
  const { t } = useTranslation("common");
  const { locale } = useRouter();
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "short", timeStyle: "short", timeZone: BRT_TIME_ZONE }).format(
    new Date(notice.createdAt),
  );
  const critical = notice.severity === "CRITICAL";
  const Icon = critical ? ShieldAlertIcon : notice.type === "EMAIL_UNVERIFIED" ? MailWarningIcon : TriangleAlertIcon;
  const role = notice.params.role ? t(`security.roles.${notice.params.role}`) : "";
  return (
    <Alert
      variant={critical ? "destructive" : "default"}
      className={cn("pr-10", critical ? "border-destructive/40 bg-destructive/5" : "border-spark/40 bg-spark/10")}
    >
      <Icon className={critical ? undefined : "text-spark"} />
      <AlertTitle className="whitespace-normal">{t(`security.notices.${notice.type}.title`)}</AlertTitle>
      <AlertDescription>
        <p>
          {t(`security.notices.${notice.type}.text`, { date, role })}
          {OFFER_RESET.has(notice.type) && (
            <>
              {" "}
              <Link href="/recuperar-senha" className="text-energy underline">
                {t("security.notMe")}
              </Link>
            </>
          )}
        </p>
      </AlertDescription>
      <Button
        size="icon-sm"
        variant="ghost"
        className="absolute top-1.5 right-1.5"
        onClick={onDismiss}
        aria-label={t("security.dismiss")}
      >
        <XIcon />
      </Button>
    </Alert>
  );
}

/** Canal "atenção"/"crítico": avisos que ficam na tela até o usuário dispensar (FN-001). */
export function SecurityNotices() {
  const { t } = useTranslation("common");
  const { notices, dismiss } = useSecurityNoticesViewModel();
  if (notices.length === 0) return null;
  return (
    <section aria-label={t("security.label")} className="mb-4 flex flex-col gap-2">
      {notices.map((n) => (
        <NoticeItem key={n.id} notice={n} onDismiss={() => dismiss(n.id)} />
      ))}
    </section>
  );
}
