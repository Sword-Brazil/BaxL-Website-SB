import { useTranslation } from "next-i18next/pages";
import { withTranslations } from "@/lib/pageProps";
import { AdminLayout } from "@/views/admin/AdminLayout";
import { CatalogEditorView } from "@/views/admin/CatalogEditorView";

export const getStaticProps = withTranslations(["admin"]);

export default function AdminCatalogPage() {
  const { t } = useTranslation("admin");
  return (
    <AdminLayout title={t("catalog.title")} help={t("catalog.help")}>
      <CatalogEditorView />
    </AdminLayout>
  );
}
