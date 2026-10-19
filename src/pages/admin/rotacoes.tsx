import { useTranslation } from "next-i18next/pages";
import { withTranslations } from "@/lib/pageProps";
import { AdminLayout } from "@/views/admin/AdminLayout";
import { RotationsAdminView } from "@/views/admin/RotationsAdminView";

export const getStaticProps = withTranslations(["admin", "common"]);

export default function AdminRotationsPage() {
  const { t } = useTranslation("admin");
  return (
    <AdminLayout title={t("nav.rotations")} subtitle={t("rotations.subtitle")} help={t("rotations.help")}>
      <RotationsAdminView />
    </AdminLayout>
  );
}
