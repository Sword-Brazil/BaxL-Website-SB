import { useTranslation } from "next-i18next/pages";
import { withTranslations } from "@/lib/pageProps";
import { AdminLayout } from "@/views/admin/AdminLayout";
import { UsersAdminView } from "@/views/admin/UsersAdminView";

export const getStaticProps = withTranslations(["admin", "auth"]);

export default function AdminUsersPage() {
  const { t } = useTranslation("admin");
  return (
    <AdminLayout title={t("users.title")} help={t("users.help")}>
      <UsersAdminView />
    </AdminLayout>
  );
}
