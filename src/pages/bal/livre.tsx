import { withTranslations } from "@/lib/pageProps";
import { BalFreeView } from "@/views/day/BalFreeView";
import { AppLayout } from "@/views/layout/AppLayout";

export const getStaticProps = withTranslations(["days", "cycle"]);

export default function BalFreePage() {
  return (
    <AppLayout title="BAL">
      <BalFreeView />
    </AppLayout>
  );
}
