import { useTranslation } from "next-i18next/pages";
import { withTranslations } from "@/lib/pageProps";
import { AppLayout } from "@/views/layout/AppLayout";
import { RosterView } from "@/views/roster/RosterView";

export const getStaticProps = withTranslations(["roster", "days"]);

export default function RosterPage() {
  const { t } = useTranslation("roster");
  return (
    <AppLayout title={t("title")}>
      <RosterView />
    </AppLayout>
  );
}
