import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import { ArrowLeftIcon, SwordIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BOSS_EFFECTS, UNKNOWN, type BossEffect } from "@/models/domain/enums";
import type { Rotation, Uniform } from "@/models/domain/types";
import { pick } from "@/models/rules/localize";
import { useContentLang } from "@/viewmodels/useContentLang";
import { useRotationsViewModel, type RotationGroup } from "@/viewmodels/useRotationsViewModel";
import { HelpHint } from "@/views/layout/HelpHint";
import { QueryState } from "@/views/shared/QueryState";
import { RotationLegend, RotationText } from "@/views/shared/RotationSequence";
import { RotationVideoPlayer } from "@/views/shared/RotationVideoPlayer";
import { UniformPreview } from "./UniformPreview";
import { AttributeLabel } from "@/views/shared/AttributeLabel";
import { BossEffectBadge, BossEffectIcon, bossEffectTint } from "@/views/shared/BossEffect";

const groupId = (uniform: Uniform | null) => `traje-${uniform?.slug ?? "todos"}`;

function UniformBadges({ uniform }: { uniform: Uniform }) {
  return (
    <span className="flex flex-wrap gap-1">
      {uniform.side !== UNKNOWN && (
        <Badge variant={uniform.side === "HERO" ? "hero" : "villain"} className="pl-1">
          <AttributeLabel value={uniform.side} />
        </Badge>
      )}
      {[uniform.gender, uniform.species, uniform.attackType]
        .filter((v) => v !== UNKNOWN)
        .map((v) => (
          <Badge key={v} variant="outline" className="pl-1">
            <AttributeLabel value={v} />
          </Badge>
        ))}
    </span>
  );
}

function RotationCard({
  rotation,
  index,
  agentName,
}: {
  rotation: Rotation;
  index: number;
  agentName: string;
}) {
  const { t } = useTranslation("rotations");
  const lang = useContentLang();
  const title = pick(rotation.title, rotation.titleEn, lang) || t("untitled", { n: index + 1 });
  const description = pick(rotation.description, rotation.descriptionEn, lang);
  return (
    <article className="flex flex-col gap-2.5 rounded-lg border border-border/70 bg-background/50 p-3">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-heading text-sm font-semibold tracking-wider text-spark uppercase">{title}</h3>
        {rotation.effect ? (
          <BossEffectBadge effect={rotation.effect} />
        ) : (
          <Badge variant="outline">{t("common:effects.all")}</Badge>
        )}
      </header>
      <RotationText text={rotation.sequence} />
      {description && <p className="text-sm whitespace-pre-line text-muted-foreground">{description}</p>}
      {/* No PC o vídeo não ocupa mais a largura toda. */}
      {rotation.videoUrl && (
        <div className="w-full md:max-w-[26rem]">
          <RotationVideoPlayer url={rotation.videoUrl} title={`${agentName} · ${title}`} />
        </div>
      )}
    </article>
  );
}

/** Filtro por temporada (efeito do chefe): "Todas" ou um efeito; as rotações sem temporada sempre aparecem. */
function EffectFilter({ effects, value, onChange }: { effects: BossEffect[]; value: BossEffect | null; onChange: (e: BossEffect | null) => void }) {
  const { t } = useTranslation(["rotations", "common"]);
  const chip = "flex h-7 cursor-pointer items-center gap-1 rounded-full border px-2.5 text-xs transition-colors";
  return (
    <div role="group" aria-label={t("rotations:season")} className="flex flex-wrap items-center gap-1.5">
      <span className="font-heading text-[0.65rem] tracking-[0.2em] text-muted-foreground uppercase">{t("rotations:season")}</span>
      <button type="button" aria-pressed={!value} onClick={() => onChange(null)} className={cn(chip, !value ? "border-spark bg-spark/10 text-spark" : "border-border hover:border-spark/60")}>
        {t("common:effects.all")}
      </button>
      {effects.map((e) => (
        <button
          key={e}
          type="button"
          aria-pressed={value === e}
          onClick={() => onChange(e)}
          className={cn(chip, "pl-1", value !== e && "border-border opacity-70 hover:opacity-100")}
          style={value === e ? bossEffectTint(e) : undefined}
        >
          <BossEffectIcon effect={e} />
          {t(`common:effects.${e}`)}
        </button>
      ))}
    </div>
  );
}

function GroupSection({
  group,
  agentName,
  fallbackSrc,
  highlighted,
}: {
  group: RotationGroup;
  agentName: string;
  fallbackSrc?: string;
  highlighted: boolean;
}) {
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
  const allGroups = agent ? vm.groupsOf(agent) : [];
  // Temporada: a escolhida aqui ou a do link vindo da tela de BA (?efeito=).
  const fromLink = typeof router.query.efeito === "string" && (BOSS_EFFECTS as readonly string[]).includes(router.query.efeito) ? (router.query.efeito as BossEffect) : null;
  const [picked, setPicked] = useState<BossEffect | null | undefined>(undefined);
  const effectFilter = picked === undefined ? fromLink : picked;
  const effects = BOSS_EFFECTS.filter((e) => allGroups.some((g) => g.rotations.some((r) => r.effect === e)));
  const groups = allGroups
    .map((g) => ({ ...g, rotations: g.rotations.filter((r) => !effectFilter || !r.effect || r.effect === effectFilter) }))
    .filter((g) => g.rotations.length > 0);
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
              <HelpHint title={t("rotations:legendTitle")} guide="rotations">
                <RotationLegend />
              </HelpHint>
            </div>
            {effects.length > 0 && <EffectFilter effects={effects} value={effectFilter} onChange={setPicked} />}
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
                <GroupSection
                  key={groupId(g.uniform)}
                  group={g}
                  agentName={agent.name}
                  fallbackSrc={fallbackSrc}
                  highlighted={g === target}
                />
              ))
            )}
          </>
        )}
      </QueryState>
    </div>
  );
}
