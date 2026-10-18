import Link from "next/link";
import { useTranslation } from "next-i18next/pages";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { withTranslations } from "@/lib/pageProps";
import { useAuthViewModel } from "@/viewmodels/useAuthViewModel";
import { AdminLayout } from "@/views/admin/AdminLayout";

export const getStaticProps = withTranslations(["admin"]);

const SECTIONS = [
  { href: "/admin/dias", key: "days" },
  { href: "/admin/metas", key: "metas" },
  { href: "/admin/catalogo", key: "catalog" },
  { href: "/admin/ctps", key: "ctps", adminOnly: true },
  { href: "/admin/bai", key: "bai" },
  { href: "/admin/usuarios", key: "users", adminOnly: true },
  { href: "/admin/config", key: "settings", adminOnly: true },
] as const;

export default function AdminHome() {
  const { t } = useTranslation("admin");
  const { user, isAdmin } = useAuthViewModel();
  return (
    <AdminLayout title={t("nav.overview")} subtitle={t("overview.text")}>
      <p className="font-heading text-lg">{t("overview.welcome", { name: user?.nickname ?? user?.email ?? "" })}</p>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.filter((s) => !("adminOnly" in s) || isAdmin).map((s) => (
          <li key={s.href}>
            <Link href={s.href} className="block h-full rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
              <Card variant="panel" className="h-full transition-colors hover:bg-accent/40">
                <CardHeader>
                  <CardTitle className="tracking-wider text-energy uppercase">{t(`nav.${s.key}`)}</CardTitle>
                  <CardDescription>{t(`overview.${s.key}`)}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </AdminLayout>
  );
}
