import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import { Area, AreaChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from "recharts";
import { LockIcon, TrendingDownIcon, TrendingUpIcon, TrophyIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, type ChartConfig } from "@/components/ui/chart";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WEEKDAYS, weekdayOf } from "@/models/domain/enums";
import { addDays, parsePoints, type Comparison } from "@/models/rules/scores";
import { useScoresViewModel, type ScoresViewModel } from "@/viewmodels/useScoresViewModel";
import { HelpHint } from "@/views/layout/HelpHint";
import { MODE_VISUALS } from "@/views/shared/modeVisuals";
import { QueryState } from "@/views/shared/QueryState";
import { TeamStrip } from "@/views/shared/TeamStrip";

const COMPACT_TABLE = "text-xs sm:text-sm [&_td]:px-1.5 [&_th]:px-1.5 sm:[&_td]:px-2 sm:[&_th]:px-2";

function useFormat() {
  const { locale } = useRouter();
  const number = new Intl.NumberFormat(locale);
  const compact = new Intl.NumberFormat(locale, {
    notation: "compact",
    maximumFractionDigits: 1,
  });
  const percent = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 });
  const date = new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
  });
  return {
    n: (v: number) => number.format(v),
    compact: (v: number) => compact.format(v),
    signed: (v: number) => `${v > 0 ? "+" : ""}${number.format(v)}`,
    pct: (v: number) => `${v > 0 ? "+" : ""}${percent.format(v)}`,
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

/** Crescimento contra o mês anterior: verde se cresceu, vermelho se caiu, com a porcentagem. */
function GrowthBadge({ cmp, className }: { cmp: Comparison; className?: string }) {
  const f = useFormat();
  if (cmp.delta === null) return null;
  const up = cmp.delta >= 0;
  return (
    <Badge variant="outline" className={cn("tabular-nums", up ? "text-gain" : "text-loss", className)}>
      {up ? <TrendingUpIcon /> : <TrendingDownIcon />}
      {cmp.pct === null ? f.signed(cmp.delta) : f.pct(cmp.pct)}
    </Badge>
  );
}

/** Cartão de número com crescimento, no estilo dos "section cards" do dashboard do shadcn. */
function StatCard({ label, cmp, footer }: { label: string; cmp: Comparison; footer?: string }) {
  const { t } = useTranslation("scores");
  const f = useFormat();
  return (
    <Card className="bg-linear-to-t from-energy/5 to-card">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="font-heading text-2xl font-bold tabular-nums sm:text-3xl">
          {cmp.current === null ? "—" : f.n(cmp.current)}
        </CardTitle>
        <CardAction>
          <GrowthBadge cmp={cmp} />
        </CardAction>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-0.5 text-xs text-muted-foreground">
        {cmp.previous === null ? (
          <span>{t("compare.noPrevious")}</span>
        ) : (
          <span>
            {t("compare.previousWas", { value: f.n(cmp.previous) })}
            {cmp.delta !== null && <span className={cmp.delta >= 0 ? "text-gain" : "text-loss"}> ({f.signed(cmp.delta)})</span>}
          </span>
        )}
        {footer && <span>{footer}</span>}
      </CardFooter>
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
      <StatCard label={t("cards.today")} cmp={s.today} footer={t("cards.todayFooter")} />
      <StatCard label={t("cards.week", { n: vm.current.week })} cmp={s.week} footer={t("cards.weekFooter")} />
      <StatCard
        label={t("cards.season")}
        cmp={s.season}
        footer={t("cards.seasonFooter", { count: s.seasonDays, date: f.date(vm.current.seasonStart) })}
      />
      <Card className="bg-linear-to-t from-energy/5 to-card">
        <CardHeader>
          <CardDescription>{t("cards.best")}</CardDescription>
          <CardTitle className="font-heading text-2xl font-bold tabular-nums sm:text-3xl">{s.best ? f.n(s.best.total) : "—"}</CardTitle>
        </CardHeader>
        <CardFooter className="text-xs text-muted-foreground">
          {s.best ? t("cards.bestFooter", { day: vm.dayOf(s.best.date)?.cycleDay, date: f.date(s.best.date) }) : t("cards.bestNone")}
        </CardFooter>
      </Card>
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
                {/* Dia do reset: antes das 22h conta na semana que acaba; depois, na semana nova. */}
                {vm.phases.map((phase) => (
                  <div key={phase} className="flex flex-col gap-1">
                    {vm.phases.length > 1 && (
                      <span className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs">
                        <span className="font-medium">{t(`scores:entry.phase.${phase}`)}</span>
                        <span className="text-muted-foreground">
                          {t("scores:entry.countsFor", { n: phase === "pre" ? (vm.day!.week === 1 ? 4 : vm.day!.week - 1) : vm.day!.week })}
                        </span>
                        {vm.date === vm.today && phase === vm.currentPhase && (
                          <Badge variant="outline" className="h-4 px-1.5 text-[0.6rem] text-energy">
                            {t("scores:entry.now")}
                          </Badge>
                        )}
                      </span>
                    )}
                    <ScoreInput
                      key={`${vm.date}-${mode}-${phase}`}
                      value={vm.scoreOf(vm.date!, mode, phase)}
                      onSave={(v) => vm.setScore(vm.date!, mode, v, phase)}
                      label={`${mode} · ${dayLabel(vm.date!)}${vm.phases.length > 1 ? ` · ${t(`scores:entry.phase.${phase}`)}` : ""}`}
                    />
                  </div>
                ))}
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

type CompareRow = Comparison & { label: string; detail?: string };

/** Dica do gráfico: esta temporada, o mês anterior, a diferença e a porcentagem. */
function CompareTooltip({ active, payload }: { active?: boolean; payload?: { payload: CompareRow }[] }) {
  const { t } = useTranslation("scores");
  const f = useFormat();
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;
  return (
    <div className="grid min-w-44 gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
      <span className="font-medium">
        {row.label}
        {row.detail && <span className="ml-1 font-normal text-muted-foreground">{row.detail}</span>}
      </span>
      <span className="flex justify-between gap-3">
        <span className="text-muted-foreground">{t("compare.current")}</span>
        <span className="font-mono font-medium tabular-nums">{row.current === null ? "—" : f.n(row.current)}</span>
      </span>
      <span className="flex justify-between gap-3">
        <span className="text-muted-foreground">{t("compare.previous")}</span>
        <span className="font-mono font-medium tabular-nums">{row.previous === null ? "—" : f.n(row.previous)}</span>
      </span>
      {row.delta !== null && (
        <span className={cn("flex justify-between gap-3 font-medium", row.delta >= 0 ? "text-gain" : "text-loss")}>
          <span>{t("compare.growth")}</span>
          <span className="font-mono tabular-nums">
            {f.signed(row.delta)}
            {row.pct !== null && ` (${f.pct(row.pct)})`}
          </span>
        </span>
      )}
    </div>
  );
}

/**
 * Esta temporada (área forte) contra o mês anterior (área clara e tracejada), no estilo do "Area
 * Chart - Interactive" do shadcn.
 */
function CompareArea({ id, data }: { id: string; data: CompareRow[] }) {
  const { t } = useTranslation("scores");
  const f = useFormat();
  const config = {
    previous: { label: t("compare.previous"), color: "var(--ramp3-1)" },
    current: { label: t("compare.current"), color: "var(--ramp3-3)" },
  } satisfies ChartConfig;
  const single = data.filter((d) => d.current !== null).length <= 1;
  return (
    <ChartContainer config={config} className="aspect-auto h-64 w-full">
      <AreaChart data={data} margin={{ top: 8, left: 4, right: 8 }}>
        <defs>
          {(["previous", "current"] as const).map((k) => (
            <linearGradient key={k} id={`${id}-${k}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={`var(--color-${k})`} stopOpacity={k === "current" ? 0.55 : 0.25} />
              <stop offset="95%" stopColor={`var(--color-${k})`} stopOpacity={0.02} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid vertical={false} strokeOpacity={0.5} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={16} tick={{ fontSize: 11 }} />
        <YAxis tickLine={false} axisLine={false} width={48} tickFormatter={(v: number) => f.compact(v)} tick={{ fontSize: 11 }} />
        <ChartTooltip cursor={{ strokeOpacity: 0.4 }} content={<CompareTooltip />} />
        <Area
          dataKey="previous"
          type="monotone"
          fill={`url(#${id}-previous)`}
          stroke="var(--color-previous)"
          strokeWidth={2}
          strokeDasharray="5 4"
          connectNulls
          isAnimationActive={false}
        />
        <Area
          dataKey="current"
          type="monotone"
          fill={`url(#${id}-current)`}
          stroke="var(--color-current)"
          strokeWidth={2}
          dot={single ? { r: 4, fill: "var(--color-current)", strokeWidth: 0 } : false}
          isAnimationActive={false}
        />
        <ChartLegend content={<ChartLegendContent />} />
      </AreaChart>
    </ChartContainer>
  );
}

/** Crescimento contra o mês anterior: verde acima do zero, vermelho abaixo. */
function GrowthArea({ id, data }: { id: string; data: CompareRow[] }) {
  const { t } = useTranslation("scores");
  const f = useFormat();
  const values = data.flatMap((d) => (d.delta === null ? [] : [d.delta]));
  const max = Math.max(0, ...values);
  const min = Math.min(0, ...values);
  // Ponto do degradê em que a área cruza o zero (a área vai do maior ao menor valor).
  const zero = max === min ? 1 : max / (max - min);
  const config = { delta: { label: t("compare.growth"), color: "var(--gain)" } } satisfies ChartConfig;
  const single = values.length <= 1;
  return (
    <ChartContainer config={config} className="aspect-auto h-40 w-full">
      <AreaChart data={data} margin={{ top: 8, left: 4, right: 8 }}>
        <defs>
          <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
            <stop offset={0} stopColor="var(--gain)" stopOpacity={0.4} />
            <stop offset={zero} stopColor="var(--gain)" stopOpacity={0.04} />
            <stop offset={zero} stopColor="var(--loss)" stopOpacity={0.04} />
            <stop offset={1} stopColor="var(--loss)" stopOpacity={0.4} />
          </linearGradient>
          <linearGradient id={`${id}-line`} x1="0" y1="0" x2="0" y2="1">
            <stop offset={zero} stopColor="var(--gain)" />
            <stop offset={zero} stopColor="var(--loss)" />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeOpacity={0.5} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={16} tick={{ fontSize: 11 }} />
        <YAxis tickLine={false} axisLine={false} width={48} tickFormatter={(v: number) => f.compact(v)} tick={{ fontSize: 11 }} />
        <ReferenceLine y={0} stroke="var(--border)" />
        <ChartTooltip cursor={{ strokeOpacity: 0.4 }} content={<CompareTooltip />} />
        <Area
          dataKey="delta"
          type="monotone"
          baseValue={0}
          connectNulls
          fill={`url(#${id}-fill)`}
          // Degradê no traço só com ganho e perda juntos: numa linha reta (um sinal só) ele fica sem cor.
          stroke={max > 0 && min < 0 ? `url(#${id}-line)` : min < 0 ? "var(--loss)" : "var(--gain)"}
          strokeWidth={2}
          dot={
            single
              ? (p: { cx?: number; cy?: number; payload?: CompareRow; index?: number }) =>
                  p.payload?.delta === null || p.payload?.delta === undefined ? (
                    <g key={p.index} />
                  ) : (
                    <circle key={p.index} cx={p.cx} cy={p.cy} r={4} fill={p.payload.delta >= 0 ? "var(--gain)" : "var(--loss)"} />
                  )
              : false
          }
          isAnimationActive={false}
        />
      </AreaChart>
    </ChartContainer>
  );
}

/** Tabela do comparativo: cada dia (ou semana) com o mês anterior, a diferença e a porcentagem. */
function CompareTable({ rows, unit }: { rows: CompareRow[]; unit: string }) {
  const { t } = useTranslation("scores");
  const f = useFormat();
  const shown = rows.filter((r) => r.current !== null || r.previous !== null);
  if (!shown.length) return null;
  return (
    <div className="max-h-80 overflow-auto rounded-md ring-1 ring-foreground/10">
      {/* No celular: células compactas, para a coluna de crescimento caber sem cortar. */}
      <Table className={COMPACT_TABLE}>
        <TableHeader>
          <TableRow>
            <TableHead>{unit}</TableHead>
            <TableHead className="text-right">{t("compare.current")}</TableHead>
            <TableHead className="hidden text-right sm:table-cell">{t("compare.previous")}</TableHead>
            <TableHead className="text-right">{t("compare.growth")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shown.map((r) => (
            <TableRow key={r.label}>
              <TableCell className="whitespace-nowrap">
                <span className="font-medium">{r.label}</span>
                {r.detail && <span className="ml-1.5 hidden text-xs text-muted-foreground sm:inline">{r.detail}</span>}
              </TableCell>
              <TableCell className="text-right font-semibold tabular-nums">{r.current === null ? "—" : f.n(r.current)}</TableCell>
              <TableCell className="hidden text-right tabular-nums text-muted-foreground sm:table-cell">
                {r.previous === null ? "—" : f.n(r.previous)}
              </TableCell>
              <TableCell className="text-right">
                {r.delta === null ? (
                  <span className="text-muted-foreground">—</span>
                ) : (
                  <span className="inline-flex flex-col items-end gap-0.5">
                    <GrowthBadge cmp={r} />
                    <span className={cn("hidden text-xs tabular-nums sm:inline", r.delta >= 0 ? "text-gain" : "text-loss")}>
                      {f.signed(r.delta)}
                    </span>
                  </span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/**
 * Desempenho: cada dia (D1–D28) ou semana (S1–S4) da temporada contra o mesmo dia ou semana do
 * mês anterior — a BA reinicia a cada 28 dias.
 */
function PerformanceCard({ vm }: { vm: ScoresViewModel }) {
  const { t } = useTranslation(["scores", "common"]);
  const f = useFormat();
  const seasonLabel = (start: string) => `${f.date(start)} – ${f.date(addDays(start, 27))}`;
  const days: CompareRow[] = vm.days.map((d) => ({
    ...d,
    label: `D${d.cycleDay}`,
    detail: `${t(`common:weekdays.${weekdayOf(d.cycleDay)}`)} ${f.date(d.date)}${d.isBai ? " · BAI" : ""}`,
  }));
  const weeks: CompareRow[] = vm.weeks.map((w) => ({
    ...w,
    label: t("scores:compare.week", { n: w.week }),
    detail: `${f.date(w.start)}${w.partial ? ` · ${t("scores:chart.partial")}` : ""}`,
  }));
  const empty = !days.some((d) => d.current !== null || d.previous !== null);
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
        {/* Os gráficos ficam sempre montados (montar junto com o primeiro valor deixava o gráfico em branco). */}
        <CardContent className="relative flex flex-col gap-4">
          {vm.season && (
            <Select value={vm.season} onValueChange={vm.setSeason}>
              <SelectTrigger className="w-full sm:w-72" aria-label={t("scores:chart.season")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {vm.seasons.map((s) => (
                  <SelectItem key={s} value={s}>
                    {t("scores:chart.seasonOption", { range: seasonLabel(s) })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {empty && (
            <p className="absolute inset-x-6 top-1/3 z-10 rounded-md border border-dashed bg-card/90 p-6 text-center text-sm text-muted-foreground">
              {t("scores:chart.empty")}
            </p>
          )}
          <div className={cn("flex flex-col gap-4", empty && "pointer-events-none opacity-30")}>
            {(
              [
                ["days", days, t("scores:history.day"), t("scores:compare.growthTitle")],
                ["weeks", weeks, t("scores:compare.weekColumn"), t("scores:compare.growthTitleWeek")],
              ] as const
            ).map(([tab, rows, unit, growthTitle]) => (
              <TabsContent key={tab} value={tab} className="flex flex-col gap-4">
                <CompareArea id={tab} data={rows} />
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-foreground">{growthTitle}</span>
                  <GrowthArea id={`${tab}-growth`} data={rows} />
                </div>
                <CompareTable rows={rows} unit={unit} />
              </TabsContent>
            ))}
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
          {/* No celular: células compactas, para a coluna de crescimento caber sem cortar. */}
          <Table className={COMPACT_TABLE}>
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
                      <span className="font-medium sm:hidden">D{e.cycleDay}</span>
                      <span className="hidden font-medium sm:inline">{t("common:day", { number: e.cycleDay })}</span>
                      <span className="ml-1.5 hidden text-xs text-muted-foreground sm:inline">
                        {f.date(e.date)} · S{e.week}
                      </span>
                      {/* Parte antes do reset das 22h (conta na semana anterior). */}
                      {e.phase === "pre" && <span className="ml-1.5 text-[0.65rem] text-muted-foreground">{t("scores:history.preReset")}</span>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={MODE_VISUALS[e.mode].badge}>{e.mode}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">{f.n(e.points)}</TableCell>
                    {/* Contra o mesmo dia e modo do mês anterior (28 dias antes). */}
                    <TableCell className="text-right">
                      {e.delta === null ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <span className="inline-flex flex-col items-end gap-0.5">
                          <GrowthBadge cmp={e} />
                          <span className={cn("hidden text-xs tabular-nums sm:inline", e.delta >= 0 ? "text-gain" : "text-loss")}>
                            {f.signed(e.delta)}
                          </span>
                        </span>
                      )}
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
          <p>{t("help.text3")}</p>
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
