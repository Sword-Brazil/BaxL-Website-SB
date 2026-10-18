import { useTranslation } from "next-i18next/pages";
import { withTranslations } from "@/lib/pageProps";
import { LoginView } from "@/views/auth/LoginView";
import { AppLayout } from "@/views/layout/AppLayout";

export const getStaticProps = withTranslations(["auth"]);

export default function LoginPage() {
  const { t } = useTranslation("auth");
  return (
    <AppLayout title={t("login.title")}>
      <LoginView />
    </AppLayout>
  );
}
