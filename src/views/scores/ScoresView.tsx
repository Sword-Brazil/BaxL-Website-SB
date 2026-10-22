import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, XAxis, YAxis } from "recharts";
import { LockIcon, TrendingDownIcon, TrendingUpIcon, TrophyIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { WEEKDAYS } from "@/models/domain/enums";
import { parsePoints, type ScoreMode } from "@/models/rules/scores";
import { useScoresViewModel, type ScoreRange, type ScoresViewModel } from "@/viewmodels/useScoresViewModel";
import { HelpHint } from "@/views/layout/HelpHint";
import { MODE_VISUALS } from "@/views/shared/modeVisuals";
import { QueryState } from "@/views/shared/QueryState";
import { TeamStrip } from "@/views/shared/TeamStrip";

const MODE_COLORS: ChartConfig = {
  BAX: { label: "BAX", color: "var(--color-bax)" },
  BAL: { label: "BAL", color: "var(--color-bal)" },
  BAI: { label: "BAI", color: "var(--color-bai)" },
};
const GAIN = "var(--color-brazil-green)";
const LOSS = "var(--color-destructive)";
/** 2px de superfície entre segmentos empilhados (o `stroke` do Recharts vira a cor da legenda). */
const SEGMENT_GAP = "[&_.recharts-bar-rectangle_path]:stroke-card [&_.recharts-bar-rectangle_path]:[stroke-width:2px]";

function useFormat() {
  const { locale } = useRouter();
  const number = new Intl.NumberFormat(locale);
  const compact = new Intl.NumberFormat(locale, {
    notation: "compact",
    maximumFractionDigits: 1,
  });
  const date = new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
  });
  return {
    n: (v: number) => number.format(v),
    compact: (v: number) => compact.format(v),
    signed: (v: number) => `${v > 0 ? "+" : ""}${number.format(v)}`,
    date: (d: string) => date.format(new Date(`${d}T00:00:00Z`)),
  };
}

/** Antes do reset das 22h: cadeado e contagem regressiva. */
function Locked({ vm }: { vm: ScoresViewModel }) {
  const { t } = useTranslation("scores");
  const h = Math.floor(vm.msToUnlock / 3_600_000);
  const m = Math.floor((vm.msToUnlock % 3_600_000) / 60_000);
  return (
    <Card className="mx-auto w-full max-w-xl text-center">
      <CardHeader className="items-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-energy/10 text-energy">
          <LockIcon className="size-6" />
        </span>
        <CardTitle className="font-heading text-xl">{t("locked.title")}</CardTitle>
        <CardDescription className="text-pretty">{t("locked.text")}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="font-heading text-3xl font-bold tabular-nums text-energy">
          {h}h {String(m).padStart(2, "0")}min
        </p>
        <p className="text-xs text-muted-foreground">{t("locked.countdown")}</p>
      </CardContent>
    </Card>
  );
}

/** Cartão de número com tendência, no estilo dos "section cards" do dashboard do shadcn. */
function StatCard({ label, value, delta, footer }: { label: string; value: string; delta?: number | null; footer: string }) {
  const f = useFormat();
  const up = (delta ?? 0) >= 0;
  return (
    <Card className="bg-linear-to-t from-energy/5 to-card">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="font-heading text-2xl font-bold tabular-nums sm:text-3xl">{value}</CardTitle>
        {delta !== undefined && delta !== null && (
          <CardAction>
            <Badge variant="outline" className={up ? "text-brazil-green" : "text-destructive"}>
              {up ? <TrendingUpIcon /> : <TrendingDownIcon />}
              {f.signed(delta)}
            </Badge>
          </CardAction>
        )}
      </CardHeader>
      <CardFooter className="text-xs text-muted-foreground">{footer}</CardFooter>
    </Card>
  );
}

function SummaryCards({ vm }: { vm: ScoresViewModel }) {
  const { t } = useTranslation("scores");
  const f = useFormat();
  const s = vm.summary;
  if (!s || !vm.current) return null;
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label={t("cards.today")}
        value={s.today === null ? "—" : f.n(s.today)}
        delta={s.todayDelta}
        footer={t("cards.todayFooter")}
      />
      <StatCard label={t("cards.week", { n: vm.current.week })} value={f.n(s.week)} delta={s.weekDelta} footer={t("cards.weekFooter")} />
      <StatCard
        label={t("cards.season")}
        value={f.n(s.season)}
        footer={t("cards.seasonFooter", {
          count: s.seasonDays,
          date: f.date(vm.current.seasonStart),
        })}
      />
      <StatCard
        label={t("cards.best")}
        value={s.best ? f.n(s.best.total) : "—"}
        footer={
          s.best
            ? t("cards.bestFooter", {
                day: vm.dayOf(s.best.date)?.cycleDay,
                date: f.date(s.best.date),
              })
            : t("cards.bestNone")
        }
      />
    </div>
  );
}

/** Campo de pontuação: aceita "1.234.567"; salva ao sair do campo ou com Enter, e vazio apaga. */
function ScoreInput({ value, onSave, label }: { value: number | null; onSave: (v: number | null) => void; label: string }) {
  const { t } = useTranslation("scores");
  const f = useFormat();
  const [draft, setDraft] = useState<string | null>(null);
  const [invalid, setInvalid] = useState(false);
  const commit = () => {
    if (draft === null) return;
    const v = draft.trim() === "" ? null : parsePoints(draft);
    if (draft.trim() !== "" && v === null) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    setDraft(null);
    if (v !== value) onSave(v);
  };
  return (
    <div className="flex flex-col gap-1">
      <Input
        inputMode="numeric"
        autoComplete="off"
        aria-label={label}
        aria-invalid={invalid || undefined}
        placeholder={t("entry.placeholder")}
        className="h-11 font-heading text-lg tabular-nums"
        value={draft ?? (value === null ? "" : f.n(value))}
        onFocus={() => setDraft(value === null ? "" : String(value))}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && (e.currentTarget as HTMLInputElement).blur()}
      />
      {invalid && <span className="text-xs text-destructive">{t("entry.invalid")}</span>}
    </div>
  );
}

/** Preencher a pontuação de um dia: um campo por modo, ao lado da equipe montada para ele. */
function EntryCard({ vm }: { vm: ScoresViewModel }) {
  const { t } = useTranslation(["scores", "common"]);
  const f = useFormat();
  const dayLabel = (d: string) => {
    const g = vm.dayOf(d);
    if (!g) return d;
    const weekday = t(`common:weekdays.${WEEKDAYS[(g.cycleDay - 1) % 7]}`);
    return `${t("common:day", { number: g.cycleDay })} · ${weekday} ${f.date(d)}${d === vm.today ? ` · ${t("scores:entry.today")}` : ""}`;
  };
  if (!vm.date || !vm.day) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("scores:entry.title")}</CardTitle>
        <CardDescription>{t("scores:entry.subtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Select value={vm.date} onValueChange={vm.setDate}>
          <SelectTrigger className="w-full sm:w-72" aria-label={t("scores:entry.day")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {vm.dates.map((d) => (
              <SelectItem key={d} value={d}>
                {dayLabel(d)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className={cn("grid gap-4", vm.modes.length > 1 && "lg:grid-cols-2")}>
          {vm.modes.map((mode) => {
            const team = vm.teamOf(vm.day!.cycleDay, mode);
            return (
              <div
                key={mode}
                className={cn("flex flex-col gap-3 rounded-lg border p-3", MODE_VISUALS[mode].border, MODE_VISUALS[mode].tint)}
              >
                <div className="flex items-center justify-between gap-2">
                  <Badge variant={MODE_VISUALS[mode].badge}>{mode}</Badge>
                  <span className="text-xs text-muted-foreground">{t("scores:entry.points")}</span>
                </div>
                <ScoreInput
                  key={`${vm.date}-${mode}`}
                  value={vm.scoreOf(vm.date!, mode)}
                  onSave={(v) => vm.setScore(vm.date!, mode, v)}
                  label={`${mode} · ${dayLabel(vm.date!)}`}
                />
                {team.length ? (
                  <TeamStrip label={t("scores:entry.myTeam")} tone="mine" members={team} catalog={vm.catalog} />
                ) : (
                  <p className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                    {t("scores:entry.noTeam")}
                    <Button asChild size="xs" variant="outline">
                      <Link href={`/?montar=${mode}-${vm.day!.cycleDay}`}>{t("scores:entry.buildTeam")}</Link>
                    </Button>
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

/** Barras de ganho (verde) e perda (vermelho) em relação ao período anterior. */
function DeltaChart({ data, height = 160 }: { data: { label: string; delta: number | null }[]; height?: number }) {
  const { t } = useTranslation("scores");
  const f = useFormat();
  const config = {
    delta: { label: t("chart.delta"), color: GAIN },
  } satisfies ChartConfig;
  return (
    <ChartContainer config={config} className="aspect-auto w-full" style={{ height }}>
      <BarChart data={data} margin={{ left: 4, right: 8 }}>
        <CartesianGrid vertical={false} strokeWidth={1} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} interval="preserveStartEnd" tick={{ fontSize: 11 }} />
        <YAxis tickLine={false} axisLine={false} width={48} tickFormatter={(v: number) => f.compact(v)} />
        <ReferenceLine y={0} stroke="var(--border)" />
        <ChartTooltip
          cursor={{ fillOpacity: 0.3 }}
          content={<ChartTooltipContent indicator="dot" formatter={(v) => f.signed(Number(v))} />}
        />
        <Bar dataKey="delta" radius={3} maxBarSize={28} isAnimationActive={false}>
          {data.map((d, i) => (
            <Cell key={i} fill={(d.delta ?? 0) >= 0 ? GAIN : LOSS} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

/** Desempenho: pontos por dia (empilhados por modo) ou por semana, e o ganho/perda de cada período. */
function PerformanceCard({ vm }: { vm: ScoresViewModel }) {
  const { t } = useTranslation(["scores", "common"]);
  const f = useFormat();
  const daily = vm.daily.map((d) => ({ ...d, label: `D${d.cycleDay}` }));
  const weekly = vm.weekly.map((w) => ({
    ...w,
    ...w.byMode,
    label: `S${w.week} · ${f.date(w.start)}`,
  }));
  const empty = !vm.history.length;
  return (
    <Card>
      <Tabs defaultValue="days">
        <CardHeader>
          <CardTitle>{t("scores:chart.title")}</CardTitle>
          <CardDescription>{t("scores:chart.subtitle")}</CardDescription>
          <CardAction>
            <TabsList>
              <TabsTrigger value="days">{t("scores:chart.days")}</TabsTrigger>
              <TabsTrigger value="weeks">{t("scores:chart.weeks")}</TabsTrigger>
            </TabsList>
          </CardAction>
        </CardHeader>
        {/* Os gráficos ficam sempre montados (montar junto com o primeiro valor deixava o de dias em branco). */}
        <CardContent className="relative flex flex-col gap-4">
          {empty && (
            <p className="absolute inset-x-6 top-1/3 z-10 rounded-md border border-dashed bg-card/90 p-6 text-center text-sm text-muted-foreground">
              {t("scores:chart.empty")}
            </p>
          )}
          <div className={cn("flex flex-col gap-4", empty && "pointer-events-none opacity-30")}>
            <>
              <TabsContent value="days" className="flex flex-col gap-4">
                <ToggleGroup
                  type="single"
                  size="sm"
                  variant="outline"
                  value={vm.range}
                  onValueChange={(v) => v && vm.setRange(v as ScoreRange)}
                  aria-label={t("scores:chart.range")}
                >
                  {(["week", "season", "all"] as const).map((r) => (
                    <ToggleGroupItem key={r} value={r} className="px-3">
                      {t(`scores:chart.ranges.${r}`)}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
                <ChartContainer config={MODE_COLORS} className={`aspect-auto h-64 w-full ${SEGMENT_GAP}`}>
                  <BarChart data={daily} margin={{ left: 4, right: 8 }}>
                    <CartesianGrid vertical={false} strokeWidth={1} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} interval="preserveStartEnd" tick={{ fontSize: 11 }} />
                    <YAxis tickLine={false} axisLine={false} width={48} tickFormatter={(v: number) => f.compact(v)} />
                    <ChartTooltip
                      cursor={{ fillOpacity: 0.3 }}
                      content={<ChartTooltipContent indicator="dot" formatter={(v, name) => `${name} ${f.n(Number(v))}`} />}
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                    {(["BAX", "BAL", "BAI"] as ScoreMode[]).map((m) => (
                      <Bar key={m} dataKey={m} stackId="day" fill={`var(--color-${m})`} maxBarSize={28} isAnimationActive={false} />
                    ))}
                  </BarChart>
                </ChartContainer>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-foreground">{t("scores:chart.dailyDelta")}</span>
                  <DeltaChart data={daily} />
                </div>
              </TabsContent>
              <TabsContent value="weeks" className="flex flex-col gap-4">
                <ChartContainer config={MODE_COLORS} className={`aspect-auto h-64 w-full ${SEGMENT_GAP}`}>
                  <BarChart data={weekly} margin={{ left: 4, right: 8 }}>
                    <CartesianGrid vertical={false} strokeWidth={1} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                    <YAxis tickLine={false} axisLine={false} width={48} tickFormatter={(v: number) => f.compact(v)} />
                    <ChartTooltip
                      cursor={{ fillOpacity: 0.3 }}
                      content={<ChartTooltipContent indicator="dot" formatter={(v, name) => `${name} ${f.n(Number(v))}`} />}
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                    {(["BAX", "BAL", "BAI"] as ScoreMode[]).map((m) => (
                      <Bar key={m} dataKey={m} stackId="week" fill={`var(--color-${m})`} maxBarSize={48} isAnimationActive={false} />
                    ))}
                  </BarChart>
                </ChartContainer>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-foreground">{t("scores:chart.weeklyDelta")}</span>
                  <DeltaChart data={weekly} />
                </div>
              </TabsContent>
            </>
          </div>
        </CardContent>
      </Tabs>
    </Card>
  );
}

/** Tudo o que foi registrado, do mais recente para o mais antigo, com a equipe do dia. */
function HistoryCard({ vm }: { vm: ScoresViewModel }) {
  const { t } = useTranslation(["scores", "common"]);
  const f = useFormat();
  if (!vm.history.length) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("scores:history.title")}</CardTitle>
        <CardDescription>{t("scores:history.subtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="max-h-[32rem] overflow-auto rounded-md ring-1 ring-foreground/10">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("scores:history.day")}</TableHead>
                <TableHead>{t("scores:history.mode")}</TableHead>
                <TableHead className="text-right">{t("scores:history.points")}</TableHead>
                <TableHead className="text-right">{t("scores:history.delta")}</TableHead>
                <TableHead className="hidden sm:table-cell">{t("scores:history.team")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vm.history.map((e) => {
                const team = vm.teamOf(e.cycleDay, e.mode);
                return (
                  <TableRow key={`${e.date}-${e.mode}`} className="cursor-pointer" onClick={() => vm.setDate(e.date)}>
                    <TableCell className="whitespace-nowrap">
                      <span className="font-medium">{t("common:day", { number: e.cycleDay })}</span>
                      <span className="ml-1.5 hidden text-xs text-muted-foreground sm:inline">
                        {f.date(e.date)} · S{e.week}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={MODE_VISUALS[e.mode].badge}>{e.mode}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">{f.n(e.points)}</TableCell>
                    <TableCell
                      className={cn(
                        "text-right tabular-nums",
                        e.delta === null ? "text-muted-foreground" : e.delta >= 0 ? "text-brazil-green" : "text-destructive",
                      )}
                    >
                      {e.delta === null ? "—" : f.signed(e.delta)}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span className="flex -space-x-1.5">
                        {team.map((m) => {
                          const ref = vm.catalog.uniformById(m.uniformId);
                          return ref ? (
                            <Avatar key={m.slot} className="size-7 ring-2 ring-card after:hidden" title={ref.agent.name}>
                              <AvatarImage
                                src={ref.uniform.portrait || undefined}
                                alt={ref.agent.name}
                                loading="lazy"
                                className="object-cover"
                              />
                              <AvatarFallback className="bg-secondary text-[0.55rem]">{ref.agent.name.slice(0, 2)}</AvatarFallback>
                            </Avatar>
                          ) : null;
                        })}
                        {!team.length && <span className="text-xs text-muted-foreground">—</span>}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export function ScoresView() {
  const { t } = useTranslation("scores");
  const vm = useScoresViewModel();
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-heading text-3xl font-bold">
            <TrophyIcon className="size-7 text-energy" />
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <HelpHint title={t("title")}>
          <p>{t("help.text1")}</p>
          <p>{t("help.text2")}</p>
        </HelpHint>
      </div>
      <QueryState isLoading={vm.isLoading} isError={vm.isError} retry={vm.retry}>
        {vm.locked ? (
          <Locked vm={vm} />
        ) : (
          <>
            <SummaryCards vm={vm} />
            <EntryCard vm={vm} />
            <PerformanceCard vm={vm} />
            <HistoryCard vm={vm} />
          </>
        )}
      </QueryState>
    </div>
  );
}
