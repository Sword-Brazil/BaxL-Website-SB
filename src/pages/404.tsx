import { useTranslation } from "next-i18next/pages";
import { withTranslations } from "@/lib/pageProps";
import { AppLayout } from "@/views/layout/AppLayout";
import { StatusScreen } from "@/views/status/StatusScreen";

export const getStaticProps = withTranslations([]);

export default function NotFoundPage() {
  const { t } = useTranslation("common");
  return (
    <AppLayout title={t("notFound.title")}>
      <StatusScreen variant="notFound" title={t("notFound.title")} text={t("notFound.text")} />
    </AppLayout>
  );
}
