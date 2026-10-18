import { useTranslation } from "next-i18next/pages";
import { withTranslations } from "@/lib/pageProps";
import { CycleView } from "@/views/cycle/CycleView";
import { AppLayout } from "@/views/layout/AppLayout";

export const getStaticProps = withTranslations(["cycle", "days"]);

export default function CyclePage() {
  const { t } = useTranslation("cycle");
  return (
    <AppLayout title={t("title")} wide>
      <CycleView />
    </AppLayout>
  );
}
