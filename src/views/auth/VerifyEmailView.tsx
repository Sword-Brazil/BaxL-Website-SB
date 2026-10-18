import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import { CircleCheckIcon, LoaderIcon, TriangleAlertIcon } from "lucide-react";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useAuthFlowsViewModel } from "@/viewmodels/useAuthFlowsViewModel";
import { AuthCard } from "./AuthCard";

export function VerifyEmailView() {
  const { t } = useTranslation("auth");
  const router = useRouter();
  const { verify } = useAuthFlowsViewModel();
  const sent = useRef(false);

  useEffect(() => {
    const token = router.query.token;
    if (!router.isReady || sent.current || typeof token !== "string") return;
    sent.current = true;
    verify.mutate(token);
  }, [router.isReady, router.query.token, verify]);

  const failed = verify.isError || (router.isReady && typeof router.query.token !== "string");
  return (
    <AuthCard title={t("verify.title")}>
      {verify.isSuccess ? (
        <div className="flex flex-col gap-4">
          <Alert className="border-brazil-green/40">
            <CircleCheckIcon className="text-brazil-green" />
            <AlertTitle>{t("verify.ok")}</AlertTitle>
          </Alert>
          <Button asChild variant="energy">
            <Link href="/entrar">{t("login.title")}</Link>
          </Button>
        </div>
      ) : failed ? (
        <Alert variant="destructive">
          <TriangleAlertIcon />
          <AlertTitle>{t("verify.fail")}</AlertTitle>
        </Alert>
      ) : (
        <p className="flex items-center gap-2 text-muted-foreground">
          <LoaderIcon className="animate-spin" />
          {t("verify.loading")}
        </p>
      )}
    </AuthCard>
  );
}
