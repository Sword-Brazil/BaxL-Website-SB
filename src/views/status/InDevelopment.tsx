import { useEffect, type ReactNode } from "react";
import { useTranslation } from "next-i18next/pages";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { AppLayout } from "@/views/layout/AppLayout";
import { StatusScreen } from "./StatusScreen";

/** Aviso padrão (toast) de funcionalidade em desenvolvimento. */
export function useInDevelopment() {
  const { t } = useTranslation("common");
  return (feature?: string) =>
    toast.info(t("dev.toastTitle"), {
      id: `dev:${feature ?? ""}`,
      description: feature ? t("dev.toastFeature", { feature }) : t("dev.toastText"),
    });
}

/**
 * Envolve um campo ou botão que ainda não funciona: mostra o selo "Em desenvolvimento", bloqueia
 * a ação e avisa por toast ao tocar.
 */
export function InDevelopment({ feature, children, className }: { feature?: string; children: ReactNode; className?: string }) {
  const { t } = useTranslation("common");
  const notify = useInDevelopment();
  return (
    <span
      className={cn("relative inline-flex flex-col gap-1", className)}
      aria-disabled
      onClickCapture={(e) => {
        e.preventDefault();
        e.stopPropagation();
        notify(feature);
      }}
    >
      <span className="pointer-events-none opacity-50 select-none">{children}</span>
      <Badge variant="outline" className="self-start border-spark/50 text-spark">
        {t("dev.badge")}
      </Badge>
    </span>
  );
}

/** Página inteira de área ainda não pronta (mesmo visual da 404), com o toast de aviso. */
export function InDevelopmentPage({ feature }: { feature?: string }) {
  const { t } = useTranslation("common");
  const notify = useInDevelopment();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- avisa uma vez ao abrir a página
  useEffect(() => void notify(feature), [feature]);
  return (
    <AppLayout title={t("dev.pageTitle")}>
      <StatusScreen variant="dev" title={t("dev.pageTitle")} text={feature ? `${feature} — ${t("dev.pageText")}` : t("dev.pageText")} />
    </AppLayout>
  );
}
