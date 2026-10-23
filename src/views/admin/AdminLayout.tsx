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
import { LoadingState } from "@/views/shared/LoadingState";

const NAV = [
  { href: "/admin", key: "overview" },
  { href: "/admin/dias", key: "days" },
  { href: "/admin/metas", key: "metas" },
  { href: "/admin/catalogo", key: "catalog" },
  { href: "/admin/rotacoes", key: "rotations" },
  { href: "/admin/ctps", key: "ctps" },
  { href: "/admin/bai", key: "bai" },
  { href: "/admin/usuarios", key: "users" },
  { href: "/admin/config", key: "settings" },
] as const;

/** Sem sessão → /entrar; membro comum (USER) → acesso negado: a administração é só do ADMIN. */
export function AdminGuard({ children }: { children: ReactNode }) {
  const { t } = useTranslation("admin");
  const router = useRouter();
  const { user, isLoading, isAdmin } = useAuthViewModel();

  useEffect(() => {
    if (!isLoading && !user) router.replace({ pathname: "/entrar", query: { next: router.asPath } });
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return (
      <LoadingState>
        <Skeleton className="h-64 w-full" />
      </LoadingState>
    );
  }
  if (!isAdmin) {
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
  children,
}: {
  title: string;
  subtitle?: string;
  help?: string;
  children: ReactNode;
}) {
  const { t } = useTranslation("admin");
  const { pathname } = useRouter();
  return (
    <AppLayout title={`${t("title")} · ${title}`} wide>
      <AdminGuard>
        <div className="flex flex-col gap-4 sm:gap-6">
          {/* Todas as seções sempre visíveis: quebram em linhas no celular, sem rolagem escondida. */}
          <nav className="-mx-1 flex flex-wrap gap-1" aria-label={t("title")}>
            {NAV.map((n) => (
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
              <HelpHint title={title} guide="admin">
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
