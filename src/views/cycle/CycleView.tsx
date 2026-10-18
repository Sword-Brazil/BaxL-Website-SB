import { useTranslation } from "next-i18next/pages";
import { CalendarClockIcon, InfinityIcon, PencilIcon, PlusIcon, SparklesIcon, SwordsIcon, TimerResetIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { SLOTS, type DayMode, type Slot } from "@/models/domain/enums";
import type { CycleDay, CycleModeDay, MetaTeam } from "@/models/domain/types";
import type { UserTeam } from "@/models/schemas/selections";
import { useCycleViewModel, type CycleViewModel, type WeekFilter } from "@/viewmodels/useCycleViewModel";
import { useMetaUpdatesNotice } from "@/viewmodels/useMetaUpdatesNotice";
import { HelpHint } from "@/views/layout/HelpHint";
import { TeamStrip as SharedTeamStrip, type TeamTone } from "@/views/shared/TeamStrip";
import { QueryState } from "@/views/shared/QueryState";
import { RestrictionBadges } from "@/views/shared/RestrictionBadges";
import { TeamBuilderPanel } from "./TeamBuilderPanel";

type Vm = CycleViewModel;

/** Faixa de equipe ligada ao ViewModel da tela central. */
function TeamStrip(props: { label: string; tone: TeamTone; team: { slot: Slot; uniformId: string; ctpId?: string | null }[]; vm: Vm }) {
  const { vm } = props;
  return (
    <SharedTeamStrip
      label={props.label}
      tone={props.tone}
      members={props.team}
      catalog={vm.catalog}
      isOwned={vm.hasRoster ? vm.isOwned : undefined}
      equippedCtpOf={vm.equippedCtpOf}
    />
  );
}

function teamMembers(team: MetaTeam) {
  return team.members;
}

function userMembers(team: UserTeam | null) {
  return team ? SLOTS.flatMap((slot) => (team[slot] ? [{ slot, uniformId: team[slot]!.uniformId }] : [])) : [];
}

/** Coluna de um modo (BAX ou BAL) dentro de um dia. */
/** Selo de Meta alterada desde a última visita (mesmo estilo do selo "Hoje"). */
function MetaUpdatedBadge({ short = false, className }: { short?: boolean; className?: string }) {
  const { t } = useTranslation("cycle");
  return (
    <Badge className={cn("animate-pulse bg-spark text-primary-foreground", className)}>
      <SparklesIcon />
      {short ? t("metaUpdatedShort") : t("metaUpdated")}
    </Badge>
  );
}

function ModePanel({
  mode,
  day,
  data,
  vm,
  updated,
}: {
  mode: DayMode;
  day: number;
  data: CycleModeDay | null;
  vm: Vm;
  updated: boolean;
}) {
  const { t } = useTranslation(["cycle", "common"]);
  const [meta, ...alts] = data?.metaTeams ?? [];
  const mine = userMembers(vm.userTeam(mode, day));
  return (
    <div className="flex min-w-0 flex-col gap-2 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-1.5">
          <Badge variant="energy" className="h-6 px-2.5 font-heading text-sm">
            {mode}
          </Badge>
          {updated && <MetaUpdatedBadge short />}
        </span>
        <RestrictionBadges criteria={data?.criteria ?? []} />
      </div>
      {meta ? (
        <TeamStrip label={t("cycle:meta")} tone="meta" team={teamMembers(meta)} vm={vm} />
      ) : (
        <p className="rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground">{t("cycle:noTeam")}</p>
      )}
      {alts.map((alt) => (
        <TeamStrip key={alt.id} label={alt.label ?? t("cycle:alternative")} tone="alt" team={teamMembers(alt)} vm={vm} />
      ))}
      {mine.length > 0 && <TeamStrip label={t("cycle:mine")} tone="mine" team={mine} vm={vm} />}
      <Button variant={mine.length ? "ghost" : "outline"} size="sm" className="self-start" onClick={() => vm.openBuilder(mode, day)}>
        {mine.length ? <PencilIcon data-icon="inline-start" /> : <PlusIcon data-icon="inline-start" />}
        {mine.length ? t("cycle:edit") : t("cycle:build")}
      </Button>
    </div>
  );
}

/** Dia de BAI: ocupa a linha inteira (não há BAX nem BAL). */
function BaiPanel({ day, vm }: { day: number; vm: Vm }) {
  const { t } = useTranslation(["cycle", "common"]);
  const [meta, ...alts] = vm.bai?.metaTeams ?? [];
  const mine = userMembers(vm.userTeam("BAI", day));
  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-heading text-lg font-bold text-energy">
            <InfinityIcon className="size-5 shrink-0" />
            {t("cycle:bai.title")}
          </p>
          <p className="text-xs text-muted-foreground">{t("cycle:bai.text")}</p>
        </div>
        {!!vm.bai?.bosses.length && (
          <div className="flex flex-wrap items-center gap-1">
            <SwordsIcon className="size-4 text-villain" aria-label={t("cycle:bai.bosses")} />
            {vm.bai.bosses.map((b) => (
              <Badge key={b.id} variant="villain">
                {b.position}. {b.name}
              </Badge>
            ))}
          </div>
        )}
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        {meta ? (
          <TeamStrip label={t("cycle:meta")} tone="meta" team={teamMembers(meta)} vm={vm} />
        ) : (
          <p className="rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground">{t("cycle:noTeam")}</p>
        )}
        {alts.map((alt) => (
          <TeamStrip key={alt.id} label={alt.label ?? t("cycle:alternative")} tone="alt" team={teamMembers(alt)} vm={vm} />
        ))}
        {mine.length > 0 && <TeamStrip label={t("cycle:mine")} tone="mine" team={mine} vm={vm} />}
      </div>
      <Button variant={mine.length ? "ghost" : "outline"} size="sm" className="self-start" onClick={() => vm.openBuilder("BAI", day)}>
        {mine.length ? <PencilIcon data-icon="inline-start" /> : <PlusIcon data-icon="inline-start" />}
        {mine.length ? t("cycle:edit") : t("cycle:build")}
      </Button>
    </div>
  );
}

function DayRow({ day, vm, updated }: { day: CycleDay; vm: Vm; updated: ReadonlySet<string> }) {
  const { t } = useTranslation(["cycle", "common"]);
  const isToday = vm.currentDay === day.number;
  const isUpdated = (mode: string) => updated.has(day.isBai ? "BAI" : `${mode} ${day.number}`);
  const anyUpdated = day.isBai ? isUpdated("BAI") : isUpdated("BAX") || isUpdated("BAL");
  return (
    <section
      id={`dia-${day.number}`}
      aria-label={t("common:day", { number: day.number })}
      className={cn(
        "scroll-mt-20 overflow-hidden rounded-xl md:scroll-mt-32 bg-card ring-1 ring-foreground/10",
        isToday && "energy-glow ring-2 ring-energy",
        day.isBai && "bg-linear-to-r from-card via-energy/5 to-card",
      )}
    >
      <header className={cn("flex items-center gap-3 border-b px-3 py-2", isToday ? "bg-energy/10" : "bg-muted/40")}>
        <span className="font-heading text-2xl leading-none font-bold tabular-nums">{String(day.number).padStart(2, "0")}</span>
        <span className="font-heading text-sm tracking-widest text-muted-foreground uppercase">
          {t(`common:weekdays.${day.weekday}`)}
        </span>
        {day.isBai && <Badge variant="energy">BAI</Badge>}
        {anyUpdated && <MetaUpdatedBadge className="ml-auto" />}
        {isToday && (
          <Badge className={cn("animate-pulse bg-energy text-primary-foreground", !anyUpdated && "ml-auto")}>
            <CalendarClockIcon />
            {t("cycle:today")}
          </Badge>
        )}
      </header>
      {isToday && vm.clock && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 bg-energy px-3 py-1.5 font-heading text-xs tracking-wider text-primary-foreground uppercase">
          <span className="flex items-center gap-1.5">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary-foreground opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-primary-foreground" />
            </span>
            {t("cycle:youAreHere")}
          </span>
          <span className="normal-case opacity-90">{t("cycle:endsIn", { time: vm.timeToNextDay })}</span>
        </div>
      )}
      {day.isBai ? (
        <BaiPanel day={day.number} vm={vm} />
      ) : (
        <div className="grid divide-y md:grid-cols-2 md:divide-x md:divide-y-0">
          <ModePanel mode="BAX" day={day.number} data={day.bax} vm={vm} updated={isUpdated("BAX")} />
          <ModePanel mode="BAL" day={day.number} data={day.bal} vm={vm} updated={isUpdated("BAL")} />
        </div>
      )}
    </section>
  );
}

function BuilderDialog({ vm }: { vm: Vm }) {
  const { t } = useTranslation(["cycle", "days"]);
  const b = vm.builder;
  const day = b ? vm.allDays.find((d) => d.number === b.day) : null;
  const data = b && day ? (b.mode === "BAI" ? null : day[b.mode === "BAX" ? "bax" : "bal"]) : null;
  const metaTeams = b?.mode === "BAI" ? (vm.bai?.metaTeams ?? []) : (data?.metaTeams ?? []);
  const priority = b?.mode === "BAI" ? vm.bai?.priority : data?.priority;
  return (
    <Dialog open={!!b} onOpenChange={(open) => !open && vm.closeBuilder()}>
      {/* Celular: tela cheia. Notebook/PC: até 72rem, com rolagem interna. */}
      <DialogContent className="top-0 left-0 flex h-dvh max-h-dvh w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none p-0 sm:top-1/2 sm:left-1/2 sm:h-[min(92dvh,60rem)] sm:w-[calc(100vw-3rem)] sm:max-w-6xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl">
        <DialogHeader className="shrink-0 gap-1 border-b border-energy/15 px-4 py-3 pr-12 text-left sm:px-6">
          <DialogTitle className="font-heading text-lg sm:text-xl">{b ? t("cycle:builderTitle", { mode: b.mode, day: b.day }) : ""}</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">{t("days:myTeam.subtitle")}</DialogDescription>
          {data && <RestrictionBadges criteria={data.criteria} />}
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-4 sm:px-6 sm:pt-6 lg:pb-6">
          {b && (
            <TeamBuilderPanel
              teamKey={vm.teamKeyOf(b.mode, b.day)}
              criteria={data?.criteria ?? []}
              metaTeams={metaTeams}
              priority={priority ?? { solo: [], support: [] }}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Faixa com os 28 dias do ciclo: o dia atual destacado; tocar leva até o dia. */
function DayStrip({ vm }: { vm: Vm }) {
  const { t } = useTranslation(["cycle", "common"]);
  return (
    <nav aria-label={t("cycle:cycleDays")} className="overflow-x-auto pb-1 [scrollbar-width:thin]">
      <ol className="flex min-w-max gap-1">
        {vm.allDays.map((d) => {
          const isToday = vm.currentDay === d.number;
          const isPast = vm.currentDay !== null && d.number < vm.currentDay;
          return (
            <li key={d.number}>
              <button
                type="button"
                onClick={() => vm.goToDay(d.number)}
                aria-current={isToday ? "date" : undefined}
                aria-label={`${t("common:day", { number: d.number })} · ${t(`common:weekdays.${d.weekday}`)}${d.isBai ? " · BAI" : ""}${isToday ? ` · ${t("cycle:today")}` : ""}`}
                className={cn(
                  "flex h-11 w-9 flex-col items-center justify-center rounded-md border text-xs leading-none transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  d.number % 7 === 1 && d.number > 1 && "ml-2",
                  d.isBai ? "border-energy/40 bg-energy/10 text-energy" : "border-border bg-card",
                  isPast && !isToday && "opacity-50",
                  isToday && "scale-110 border-energy bg-energy font-bold text-primary-foreground shadow-[0_0_14px_-2px_var(--glow)]",
                )}
              >
                <span className="font-heading text-sm tabular-nums">{d.number}</span>
                <span className="text-[0.55rem] uppercase opacity-80">{d.isBai ? "BAI" : t(`common:weekdays.${d.weekday}`)}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function CycleView() {
  const { t } = useTranslation(["cycle", "common", "days"]);
  const vm = useCycleViewModel();
  const updated = useMetaUpdatesNotice(vm.cycle);
  const resetNotice = vm.clock?.isResetDay ? (vm.clock.beforeWeeklyReset ? "before" : "after") : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-heading text-3xl font-bold">{t("cycle:title")}</h1>
          <p className="text-sm text-muted-foreground">{t("cycle:subtitle")}</p>
        </div>
        <HelpHint title={t("cycle:legend.title")}>
          <p>{t("cycle:legend.owned")}</p>
          <p>{t("cycle:legend.dim")}</p>
          <p>{t("cycle:legend.ctp")}</p>
          <p>{t("cycle:legend.hero")}</p>
          <p>{t("cycle:legend.reset")}</p>
        </HelpHint>
      </div>

      <DayStrip vm={vm} />

      <div className="z-30 -mx-4 flex md:sticky md:top-16 flex-wrap items-center gap-2 border-b border-energy/10 bg-background/85 px-4 py-2 backdrop-blur-md">
        {vm.clock ? (
          <Button variant="energy" size="sm" onClick={vm.goToday}>
            <CalendarClockIcon data-icon="inline-start" />
            {t("cycle:today")}: {t("cycle:todayLine", { day: vm.clock.cycleDay, weekday: t(`common:weekdays.${vm.clock.weekday}`), week: vm.clock.weekIndex + 1 })}
          </Button>
        ) : (
          <Skeleton className="h-7 w-48" />
        )}
        <ToggleGroup
          type="single"
          size="sm"
          variant="outline"
          value={String(vm.week)}
          onValueChange={(v) => v && vm.setWeek((v === "all" ? "all" : Number(v)) as WeekFilter)}
          aria-label={t("cycle:weeks")}
          className="flex-wrap"
        >
          <ToggleGroupItem value="all">{t("cycle:all")}</ToggleGroupItem>
          {[1, 2, 3, 4].map((n) => (
            <ToggleGroupItem key={n} value={String(n)} aria-label={t("cycle:week", { n })}>
              S{n}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {resetNotice && (
        <Alert className="border-spark/40 bg-spark/10">
          <TimerResetIcon className="text-spark" />
          <AlertDescription>{resetNotice === "before" ? t("days:today.resetBefore") : t("days:today.resetAfter")}</AlertDescription>
        </Alert>
      )}

      <QueryState
        isLoading={vm.isLoading}
        isError={vm.isError}
        retry={vm.retry}
        skeleton={
          <div className="flex flex-col gap-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          {vm.days.map((day) => (
            <DayRow key={day.number} day={day} vm={vm} updated={updated} />
          ))}
        </div>
      </QueryState>

      <BuilderDialog vm={vm} />
    </div>
  );
}
