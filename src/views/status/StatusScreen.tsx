import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import { ArrowLeftIcon, ConstructionIcon, HomeIcon, SearchXIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/** Tela de status em página inteira: 404 ou área em desenvolvimento, com volta e ida para o início. */
export function StatusScreen({ variant, title, text }: { variant: "notFound" | "dev"; title: string; text: ReactNode }) {
  const { t } = useTranslation("common");
  const router = useRouter();
  const Icon = variant === "dev" ? ConstructionIcon : SearchXIcon;
  return (
    <div className="flex min-h-[60dvh] items-center justify-center py-8">
      <Card variant="panel" className="w-full max-w-lg text-center">
        <CardContent className="flex flex-col items-center gap-4 py-6">
          <span className="font-heading text-6xl font-bold tracking-widest text-energy/80 sm:text-7xl" aria-hidden>
            {variant === "dev" ? <Icon className="size-16 sm:size-20" /> : "404"}
          </span>
          {variant === "notFound" && <Icon className="size-6 text-muted-foreground" aria-hidden />}
          <h1 className="font-heading text-2xl font-bold sm:text-3xl">{title}</h1>
          <p className="text-sm text-muted-foreground">{text}</p>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button variant="outline" size="touch" onClick={() => router.back()}>
              <ArrowLeftIcon data-icon="inline-start" />
              {t("notFound.back")}
            </Button>
            <Button asChild variant="energy" size="touch">
              <Link href="/">
                <HomeIcon data-icon="inline-start" />
                {t("notFound.home")}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
