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
      {/* Só os dias de BAX/BAL entram na sincronização (a BAI e a BAL livre já são uma lista só). */}
      {scopeVm.isDay && <FreeDaysSyncCard vm={freeSync} cycle={scopeVm.cycle.data} />}
      <MetaTeamEditorView scopeVm={scopeVm} freeSync={freeSync.sync} />
    </AdminLayout>
  );
}
