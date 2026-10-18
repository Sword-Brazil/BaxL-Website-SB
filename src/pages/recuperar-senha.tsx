import { useTranslation } from "next-i18next/pages";
import { withTranslations } from "@/lib/pageProps";
import { ForgotPasswordView } from "@/views/auth/ForgotPasswordView";
import { AppLayout } from "@/views/layout/AppLayout";

export const getStaticProps = withTranslations(["auth"]);

export default function Page() {
  const { t } = useTranslation("auth");
  return (
    <AppLayout title={t("forgot.title")}>
      <ForgotPasswordView />
    </AppLayout>
  );
}
