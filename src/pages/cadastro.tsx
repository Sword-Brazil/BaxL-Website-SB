import { useTranslation } from "next-i18next/pages";
import { withTranslations } from "@/lib/pageProps";
import { RegisterView } from "@/views/auth/RegisterView";
import { AppLayout } from "@/views/layout/AppLayout";

export const getStaticProps = withTranslations(["auth"]);

export default function Page() {
  const { t } = useTranslation("auth");
  return (
    <AppLayout title={t("register.title")}>
      <RegisterView />
    </AppLayout>
  );
}
