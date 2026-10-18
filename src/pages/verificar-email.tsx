import { useTranslation } from "next-i18next/pages";
import { withTranslations } from "@/lib/pageProps";
import { VerifyEmailView } from "@/views/auth/VerifyEmailView";
import { AppLayout } from "@/views/layout/AppLayout";

export const getStaticProps = withTranslations(["auth"]);

export default function Page() {
  const { t } = useTranslation("auth");
  return (
    <AppLayout title={t("verify.title")}>
      <VerifyEmailView />
    </AppLayout>
  );
}
