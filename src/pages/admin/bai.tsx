import { useTranslation } from "next-i18next/pages";
import { withTranslations } from "@/lib/pageProps";
import { AdminLayout } from "@/views/admin/AdminLayout";
import { BaiEditorView } from "@/views/admin/BaiEditorView";

export const getStaticProps = withTranslations(["admin"]);

export default function AdminBaiPage() {
  const { t } = useTranslation("admin");
  return (
    <AdminLayout title={t("bai.title")} subtitle={t("bai.subtitle")} help={t("bai.help")}>
      <BaiEditorView />
    </AdminLayout>
  );
}
