import { useTranslation } from "next-i18next/pages";
import { withTranslations } from "@/lib/pageProps";
import { AppLayout } from "@/views/layout/AppLayout";
import { StatsView } from "@/views/stats/StatsView";

export const getStaticProps = withTranslations(["stats", "cycle", "roster"]);

export default function StatsPage() {
  const { t } = useTranslation("stats");
  return (
    <AppLayout title={t("title")} wide>
      <StatsView />
    </AppLayout>
  );
}
