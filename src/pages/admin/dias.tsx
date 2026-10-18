import { useTranslation } from "next-i18next/pages";
import { withTranslations } from "@/lib/pageProps";
import { AdminLayout } from "@/views/admin/AdminLayout";
import { RestrictionEditorView } from "@/views/admin/RestrictionEditorView";

export const getStaticProps = withTranslations(["admin"]);

export default function AdminDaysPage() {
  const { t } = useTranslation("admin");
  return (
    <AdminLayout title={t("days.title")} subtitle={t("days.subtitle")} help={t("days.help")}>
      <RestrictionEditorView />
    </AdminLayout>
  );
}
