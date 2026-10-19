import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import { ShieldAlertIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthViewModel } from "@/viewmodels/useAuthViewModel";
import { AppLayout } from "@/views/layout/AppLayout";
import { HelpHint } from "@/views/layout/HelpHint";

const NAV = [
  { href: "/admin", key: "overview" },
  { href: "/admin/dias", key: "days" },
  { href: "/admin/metas", key: "metas" },
  { href: "/admin/catalogo", key: "catalog" },
  { href: "/admin/rotacoes", key: "rotations" },
  { href: "/admin/ctps", key: "ctps", adminOnly: true },
  { href: "/admin/bai", key: "bai" },
  { href: "/admin/usuarios", key: "users", adminOnly: true },
  { href: "/admin/config", key: "settings", adminOnly: true },
] as const;

/** Sem sessão → /entrar; papel USER (ou não-ADMIN em página de ADMIN) → acesso negado. */
export function AdminGuard({ adminOnly = false, children }: { adminOnly?: boolean; children: ReactNode }) {
  const { t } = useTranslation("admin");
  const router = useRouter();
  const { user, isLoading, isCurator, isAdmin } = useAuthViewModel();

  useEffect(() => {
    if (!isLoading && !user) router.replace({ pathname: "/entrar", query: { next: router.asPath } });
  }, [isLoading, user, router]);

  if (isLoading || !user) return <Skeleton className="h-64 w-full" />;
  if (!isCurator || (adminOnly && !isAdmin)) {
    return (
      <Card variant="panel" className="mx-auto max-w-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl text-destructive">
            <ShieldAlertIcon />
            {t("guard.forbidden")}
          </CardTitle>
          <CardDescription>{t("guard.forbiddenText")}</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button asChild variant="outline">
            <Link href="/">{t("guard.goHome")}</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }
  return <>{children}</>;
}

export function AdminLayout({
  title,
  subtitle,
  help,
  adminOnly = false,
  children,
}: {
  title: string;
  subtitle?: string;
  help?: string;
  adminOnly?: boolean;
  children: ReactNode;
}) {
  const { t } = useTranslation("admin");
  const { pathname } = useRouter();
  const { isAdmin } = useAuthViewModel();

  return (
    <AppLayout title={`${t("title")} · ${title}`} wide>
      <AdminGuard adminOnly={adminOnly}>
        <div className="flex flex-col gap-4 sm:gap-6">
          {/* Todas as seções sempre visíveis: quebram em linhas no celular, sem rolagem escondida. */}
          <nav className="-mx-1 flex flex-wrap gap-1" aria-label={t("title")}>
            {NAV.filter((n) => !("adminOnly" in n) || isAdmin).map((n) => (
              <Button
                key={n.href}
                asChild
                size="sm"
                variant={pathname === n.href ? "secondary" : "ghost"}
                className={cn(
                  "h-9 font-heading tracking-wider uppercase",
                  pathname === n.href && "text-energy ring-1 ring-energy/40",
                )}
              >
                <Link href={n.href} aria-current={pathname === n.href ? "page" : undefined}>
                  {t(`nav.${n.key}`)}
                </Link>
              </Button>
            ))}
          </nav>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="font-heading text-xs tracking-[0.3em] text-energy uppercase">{t("title")}</p>
              <h1 className="font-heading text-2xl font-bold sm:text-3xl">{title}</h1>
              {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
            </div>
            {help && (
              <HelpHint title={title}>
                <p>{help}</p>
              </HelpHint>
            )}
          </div>
          {children}
        </div>
      </AdminGuard>
    </AppLayout>
  );
}
