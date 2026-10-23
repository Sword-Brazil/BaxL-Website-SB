import Link from "next/link";
import { useTranslation } from "next-i18next/pages";
import { ArrowRightIcon, CircleHelpIcon, LifeBuoyIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthViewModel } from "@/viewmodels/useAuthViewModel";
import { AnnotatedShot, type GuideShotId } from "./AnnotatedShot";

/** Seções do guia, na ordem da página: o print, a tela que ele mostra e quantos itens tem. */
const SECTIONS: { id: GuideShotId; href: string; markers: number; tips: number; adminOnly?: boolean; wide?: boolean }[] = [
  { id: "header", href: "/", markers: 8, tips: 3, wide: true },
  { id: "cycle", href: "/", markers: 6, tips: 3 },
  { id: "day", href: "/", markers: 7, tips: 3 },
  { id: "team", href: "/", markers: 9, tips: 3 },
  { id: "roster", href: "/meu-elenco", markers: 8, tips: 2 },
  { id: "rotations", href: "/rotacoes", markers: 4, tips: 2 },
  { id: "stats", href: "/estatisticas", markers: 8, tips: 2 },
  { id: "scores", href: "/minhas-pontuacoes", markers: 5, tips: 3 },
  { id: "admin", href: "/admin", markers: 4, tips: 2, adminOnly: true },
];

const START_STEPS = [
  { n: 1, href: null },
  { n: 2, href: "/meu-elenco" },
  { n: 3, href: "/" },
  { n: 4, href: "/minhas-pontuacoes" },
] as const;
const GENERAL = ["saved", "sync", "help", "password", "error"] as const;
const range = (n: number) => Array.from({ length: n }, (_, i) => i + 1);

const Num = ({ n }: { n: number }) => (
  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-spark font-heading text-xs font-bold text-white">{n}</span>
);

function GuideSection({ section }: { section: (typeof SECTIONS)[number] }) {
  const { t } = useTranslation("about");
  const key = `sections.${section.id}`;
  const name = t(`${key}.title`);
  return (
    <Card id={section.id} className="scroll-mt-20">
      <CardHeader>
        <CardTitle className="font-heading text-xl">{name}</CardTitle>
        <CardDescription>{t(`${key}.intro`)}</CardDescription>
      </CardHeader>
      <CardContent
        className={
          section.wide
            ? "flex flex-col gap-4"
            : "grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start"
        }
      >
        <div className="-m-3">
          <AnnotatedShot id={section.id} name={name} />
        </div>
        <div className="flex flex-col gap-4">
          <ol className={section.wide ? "grid gap-2 sm:grid-cols-2" : "flex flex-col gap-2"}>
            {range(section.markers).map((n) => (
              <li key={n} className="flex gap-2.5 text-sm">
                <Num n={n} />
                <span className="pt-0.5">{t(`${key}.markers.${n}`)}</span>
              </li>
            ))}
          </ol>
          <div className="rounded-lg border border-energy/25 bg-energy/5 p-3">
            <p className="mb-2 flex items-center gap-2 font-heading text-sm font-semibold tracking-wide text-energy">
              <LifeBuoyIcon className="size-4" aria-hidden />
              {t("stuck")}
            </p>
            <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm text-muted-foreground marker:text-energy">
              {range(section.tips).map((n) => (
                <li key={n}>{t(`${key}.tips.${n}`)}</li>
              ))}
            </ul>
          </div>
          <Button asChild variant="outline" size="sm" className="self-start">
            <Link href={section.href}>
              {t("openPage", { name })}
              <ArrowRightIcon data-icon="inline-end" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/** Guia do site: para que serve cada tela, com prints marcados e o que procurar quando travar. */
export function AboutView() {
  const { t } = useTranslation("about");
  const { isAdmin } = useAuthViewModel();
  const sections = SECTIONS.filter((s) => !s.adminOnly || isAdmin);
  return (
    <div className="flex flex-col gap-6">
      <div className="min-w-0">
        <h1 className="flex items-center gap-2 font-heading text-3xl font-bold">
          <CircleHelpIcon className="size-7 text-energy" aria-hidden />
          {t("title")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <nav aria-label={t("toc")} className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">{t("toc")}</span>
        {[{ id: "start" }, ...sections, { id: "general" }].map((s) => (
          <Badge key={s.id} asChild variant="outline" className="h-7 px-3 text-xs">
            <a href={`#${s.id}`}>{s.id === "start" || s.id === "general" ? t(`${s.id}.title`) : t(`sections.${s.id}.title`)}</a>
          </Badge>
        ))}
      </nav>

      <Card id="start" variant="panel" className="scroll-mt-20">
        <CardHeader>
          <CardTitle className="font-heading text-xl text-energy">{t("start.title")}</CardTitle>
          <CardDescription>{t("start.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {START_STEPS.map(({ n, href }) => {
              const text = <span className="pt-0.5">{t(`start.steps.${n}`)}</span>;
              return (
                <li key={n} className="flex gap-2.5 text-sm">
                  <Num n={n} />
                  {href ? (
                    <Link href={href} className="rounded-sm underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50">
                      {text}
                    </Link>
                  ) : (
                    text
                  )}
                </li>
              );
            })}
          </ol>
        </CardContent>
      </Card>

      {sections.map((s) => (
        <GuideSection key={s.id} section={s} />
      ))}

      <Card id="general" className="scroll-mt-20">
        <CardHeader>
          <CardTitle className="font-heading text-xl">{t("general.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="flex list-disc flex-col gap-2 pl-5 text-sm marker:text-energy">
            {GENERAL.map((k) => (
              <li key={k}>{t(`general.items.${k}`)}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
