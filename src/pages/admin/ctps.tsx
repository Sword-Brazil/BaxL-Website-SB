import { useTranslation } from "next-i18next/pages";
import { withTranslations } from "@/lib/pageProps";
import { AdminLayout } from "@/views/admin/AdminLayout";
import { CtpAdminView } from "@/views/admin/CtpAdminView";

export const getStaticProps = withTranslations(["admin", "common"]);

export default function AdminCtpsPage() {
  const { t } = useTranslation("admin");
  return <AdminLayout title={t("ctps.title")} help={t("ctps.help")}><CtpAdminView /></AdminLayout>;
}
