import { useTranslation } from "next-i18next/pages";
import { withTranslations } from "@/lib/pageProps";
import { AboutView } from "@/views/about/AboutView";
import { AppLayout } from "@/views/layout/AppLayout";

export const getStaticProps = withTranslations(["about"]);

export default function AboutPage() {
  const { t } = useTranslation("about");
  return (
    <AppLayout title={t("title")}>
      <AboutView />
    </AppLayout>
  );
}
