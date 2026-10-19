import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import { ArrowLeftIcon, SwordIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UNKNOWN } from "@/models/domain/enums";
import type { Rotation, Uniform } from "@/models/domain/types";
import { useRotationsViewModel, type RotationGroup } from "@/viewmodels/useRotationsViewModel";
import { HelpHint } from "@/views/layout/HelpHint";
import { QueryState } from "@/views/shared/QueryState";
import { RotationLegend, RotationText, RotationVideoPlayer } from "@/views/shared/RotationSequence";
import { UniformPreview } from "./UniformPreview";

const groupId = (uniform: Uniform | null) => `traje-${uniform?.slug ?? "todos"}`;

function UniformBadges({ uniform }: { uniform: Uniform }) {
  const { t } = useTranslation("common");
  return (
    <span className="flex flex-wrap gap-1">
      {uniform.side !== UNKNOWN && <Badge variant={uniform.side === "HERO" ? "hero" : "villain"}>{t(`values.${uniform.side}`)}</Badge>}
      {[uniform.species, uniform.attackType]
        .filter((v) => v !== UNKNOWN)
        .map((v) => (
          <Badge key={v} variant="outline">
            {t(`values.${v}`)}
          </Badge>
        ))}
    </span>
  );
}

function RotationCard({ rotation, index, agentName }: { rotation: Rotation; index: number; agentName: string }) {
  const { t } = useTranslation("rotations");
  const title = rotation.title || t("untitled", { n: index + 1 });
  return (
    <article className="flex flex-col gap-2.5 rounded-lg border border-border/70 bg-background/50 p-3">
      <h3 className="font-heading text-sm font-semibold tracking-wider text-spark uppercase">{title}</h3>
      <RotationText text={rotation.sequence} />
      {rotation.description && <p className="text-sm whitespace-pre-line text-muted-foreground">{rotation.description}</p>}
      {rotation.videoUrl && <RotationVideoPlayer url={rotation.videoUrl} title={`${agentName} · ${title}`} />}
    </article>
  );
}

function GroupSection({ group, agentName, fallbackSrc, highlighted }: { group: RotationGroup; agentName: string; fallbackSrc?: string; highlighted: boolean }) {
  const { t } = useTranslation("rotations");
  return (
    <section
      id={groupId(group.uniform)}
      className={cn(
        "scroll-mt-24 rounded-xl bg-card p-3 ring-1 ring-foreground/10 sm:p-4",
        highlighted && "energy-glow ring-2 ring-spark/60",
      )}
    >
      <header className="mb-3 flex items-center gap-3">
        <UniformPreview uniform={group.uniform} name={agentName} fallbackSrc={fallbackSrc} className="size-20 sm:size-24" />
        <div className="min-w-0">
          <p className="font-heading text-[0.65rem] tracking-[0.2em] text-muted-foreground uppercase">
            {group.uniform ? t("uniform") : t("allUniforms")}
          </p>
          <h2 className="truncate font-heading text-xl font-bold">{group.uniform?.name ?? t("allUniformsTitle")}</h2>
          {group.uniform && <UniformBadges uniform={group.uniform} />}
          {highlighted && <p className="mt-1 text-xs text-spark">{t("usedInTeam")}</p>}
        </div>
      </header>
      <div className="flex flex-col gap-3">
        {group.rotations.map((r, i) => (
          <RotationCard key={r.id} rotation={r} index={i} agentName={agentName} />
        ))}
      </div>
    </section>
  );
}

/** Rotações de um personagem, separadas por traje (com prévia do traje), descrição e vídeo. */
export function AgentRotationsView() {
  const { t } = useTranslation(["rotations", "common"]);
  const router = useRouter();
  const vm = useRotationsViewModel();
  const slug = String(router.query.slug ?? "");
  const trajeSlug = typeof router.query.traje === "string" ? router.query.traje : null;
  const agent = vm.agentBySlug(slug);
  const groups = agent ? vm.groupsOf(agent) : [];
  // O traje da equipe tem rotação própria? Senão destaca as rotações gerais.
  const target = groups.find((g) => g.uniform?.slug === trajeSlug) ?? (trajeSlug ? groups.find((g) => !g.uniform) : undefined);
  const fallbackSrc = agent?.uniforms.find((u) => u.slug === trajeSlug)?.portrait ?? agent?.uniforms.find((u) => u.portrait)?.portrait;

  useEffect(() => {
    if (target) document.getElementById(groupId(target.uniform))?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [target]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => (window.history.length > 1 ? router.back() : router.push("/rotacoes"))}>
          <ArrowLeftIcon data-icon="inline-start" />
          {t("common:notFound.back")}
        </Button>
        <Button asChild variant="link" size="sm">
          <Link href="/rotacoes">{t("rotations:all")}</Link>
        </Button>
      </div>
      <QueryState isLoading={vm.isLoading} isError={vm.isError} retry={vm.retry} skeleton={<Skeleton className="h-72 w-full" />}>
        {!agent ? (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">{t("rotations:notFound")}</p>
        ) : (
          <>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 font-heading text-xs tracking-[0.2em] text-spark uppercase">
                  <SwordIcon className="size-3.5" />
                  {t("common:team.damageDealer")}
                </p>
                <h1 className="font-heading text-3xl font-bold">{t("rotations:titleOf", { name: agent.name })}</h1>
              </div>
              <HelpHint title={t("rotations:legendTitle")}>
                <RotationLegend />
              </HelpHint>
            </div>
            {groups.length > 1 && (
              <nav aria-label={t("rotations:uniforms")} className="flex flex-wrap gap-1.5">
                {groups.map((g) => (
                  <a
                    key={groupId(g.uniform)}
                    href={`#${groupId(g.uniform)}`}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs transition-colors hover:border-spark/60",
                      g === target && "border-spark bg-spark/10 text-spark",
                    )}
                  >
                    <UniformPreview uniform={g.uniform} name={agent.name} fallbackSrc={fallbackSrc} className="size-6" />
                    {g.uniform?.name ?? t("rotations:allUniformsTitle")}
                    <span className="text-muted-foreground">({g.rotations.length})</span>
                  </a>
                ))}
              </nav>
            )}
            {groups.length === 0 ? (
              <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                {t("rotations:empty", { name: agent.name })}
              </p>
            ) : (
              groups.map((g) => (
                <GroupSection key={groupId(g.uniform)} group={g} agentName={agent.name} fallbackSrc={fallbackSrc} highlighted={g === target} />
              ))
            )}
          </>
        )}
      </QueryState>
    </div>
  );
}
