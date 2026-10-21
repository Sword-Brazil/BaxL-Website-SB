import type { GetStaticPaths } from "next";
import { useTranslation } from "next-i18next/pages";
import { withTranslations } from "@/lib/pageProps";
import { AppLayout } from "@/views/layout/AppLayout";
import { AgentRotationsView } from "@/views/rotations/AgentRotationsView";

// Só as traduções no build; o personagem vem do catálogo no cliente (slugs mudam no admin).
export const getStaticPaths: GetStaticPaths = async () => ({ paths: [], fallback: "blocking" });
export const getStaticProps = withTranslations(["rotations"]);

export default function AgentRotationsPage() {
  const { t } = useTranslation("rotations");
  return (
    <AppLayout title={t("title")}>
      <AgentRotationsView />
    </AppLayout>
  );
}
