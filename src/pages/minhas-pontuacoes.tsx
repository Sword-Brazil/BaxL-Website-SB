import { useTranslation } from "next-i18next/pages";
import { withTranslations } from "@/lib/pageProps";
import { AppLayout } from "@/views/layout/AppLayout";
import { ScoresView } from "@/views/scores/ScoresView";

export const getStaticProps = withTranslations(["scores"]);

export default function ScoresPage() {
  const { t } = useTranslation("scores");
  return (
    <AppLayout title={t("title")} wide>
      <ScoresView />
    </AppLayout>
  );
}
