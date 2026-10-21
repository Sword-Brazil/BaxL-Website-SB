import { useTranslation } from "next-i18next/pages";
import { withTranslations } from "@/lib/pageProps";
import { AppLayout } from "@/views/layout/AppLayout";
import { RotationsIndexView } from "@/views/rotations/RotationsIndexView";

export const getStaticProps = withTranslations(["rotations"]);

export default function RotationsPage() {
  const { t } = useTranslation("rotations");
  return (
    <AppLayout title={t("title")}>
      <RotationsIndexView />
    </AppLayout>
  );
}
