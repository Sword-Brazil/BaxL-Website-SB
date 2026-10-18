import { useTranslation } from "next-i18next/pages";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { withTranslations } from "@/lib/pageProps";
import { useMetaScopeViewModel } from "@/viewmodels/admin/useMetaScopeViewModel";
import { AdminLayout } from "@/views/admin/AdminLayout";
import { MetaScopeBar } from "@/views/admin/MetaScopeBar";
import { MetaTeamEditorView } from "@/views/admin/MetaTeamEditorView";
import { PriorityEditorView } from "@/views/admin/PriorityEditorView";

export const getStaticProps = withTranslations(["admin"]);

export default function AdminMetasPage() {
  const { t } = useTranslation("admin");
  const scopeVm = useMetaScopeViewModel();
  return (
    <AdminLayout title={t("metas.title")} help={t("metas.help")}>
      <MetaScopeBar vm={scopeVm} />
      <Tabs defaultValue="teams">
        <TabsList>
          <TabsTrigger value="teams">{t("metas.teamsTab")}</TabsTrigger>
          <TabsTrigger value="priority" disabled={scopeVm.scope === "BAL_FREE"}>
            {t("metas.priorityTab")}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="teams">
          <MetaTeamEditorView scopeVm={scopeVm} />
        </TabsContent>
        <TabsContent value="priority">
          <PriorityEditorView scopeVm={scopeVm} />
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}
