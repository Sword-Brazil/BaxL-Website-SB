import { useTranslation } from "next-i18next/pages";
import { withTranslations } from "@/lib/pageProps";
import { AdminLayout } from "@/views/admin/AdminLayout";
import { SettingsView } from "@/views/admin/SettingsView";

export const getStaticProps = withTranslations(["admin", "days"]);

export default function AdminSettingsPage() {
  const { t } = useTranslation("admin");
  return (
    <AdminLayout title={t("settings.title")} help={t("settings.help")} adminOnly>
      <SettingsView />
    </AdminLayout>
  );
}
