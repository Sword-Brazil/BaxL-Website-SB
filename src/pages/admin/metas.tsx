import { useTranslation } from "next-i18next/pages";
import { withTranslations } from "@/lib/pageProps";
import { useFreeDaysSyncViewModel } from "@/viewmodels/admin/useFreeDaysSyncViewModel";
import { useMetaScopeViewModel } from "@/viewmodels/admin/useMetaScopeViewModel";
import { FreeDaysSyncCard } from "@/views/admin/FreeDaysSync";
import { AdminLayout } from "@/views/admin/AdminLayout";
import { MetaScopeBar } from "@/views/admin/MetaScopeBar";
import { MetaTeamEditorView } from "@/views/admin/MetaTeamEditorView";

export const getStaticProps = withTranslations(["admin"]);

export default function AdminMetasPage() {
  const { t } = useTranslation("admin");
  const scopeVm = useMetaScopeViewModel();
  const freeSync = useFreeDaysSyncViewModel();
  return (
    <AdminLayout title={t("metas.title")} help={t("metas.help")}>
      <MetaScopeBar vm={scopeVm} />
      {/* Só dias de BAX/BAL e BAI entram na sincronização (a BAL livre é outra lista). */}
      {scopeVm.scope !== "BAL_FREE" && <FreeDaysSyncCard vm={freeSync} cycle={scopeVm.cycle.data} />}
      <MetaTeamEditorView scopeVm={scopeVm} freeSync={freeSync.sync} />
    </AdminLayout>
  );
}
