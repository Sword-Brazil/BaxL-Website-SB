import { useTranslation } from "next-i18next/pages";
import { withTranslations } from "@/lib/pageProps";
import { useMetaScopeViewModel } from "@/viewmodels/admin/useMetaScopeViewModel";
import { AdminLayout } from "@/views/admin/AdminLayout";
import { MetaScopeBar } from "@/views/admin/MetaScopeBar";
import { MetaTeamEditorView } from "@/views/admin/MetaTeamEditorView";

export const getStaticProps = withTranslations(["admin"]);

export default function AdminMetasPage() {
  const { t } = useTranslation("admin");
  const scopeVm = useMetaScopeViewModel();
  return (
    <AdminLayout title={t("metas.title")} help={t("metas.help")}>
      <MetaScopeBar vm={scopeVm} />
      <MetaTeamEditorView scopeVm={scopeVm} />
    </AdminLayout>
  );
}
