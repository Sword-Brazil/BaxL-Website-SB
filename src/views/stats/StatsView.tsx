import Link from "next/link";
import { useTranslation } from "next-i18next/pages";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Field, FieldLabel } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { CTP_QUALITIES } from "@/models/domain/enums";
import type { StatsMode } from "@/models/rules/stats";
import { useStatsViewModel, type RepetitionSource } from "@/viewmodels/useStatsViewModel";
import { HelpHint } from "@/views/layout/HelpHint";
import { QueryState } from "@/views/shared/QueryState";
import { TeamStrip } from "@/views/shared/TeamStrip";

const WEEK_KEYS = ["w1", "w2", "w3", "w4"] as const;
const BAR_ROW_PX = 28;
/** 2px de superfície entre segmentos empilhados (via CSS: o `stroke` do Recharts vira a cor da legenda). */
const SEGMENT_GAP = "[&_.recharts-bar-rectangle_path]:stroke-card [&_.recharts-bar-rectangle_path]:[stroke-width:2px]";

function RepetitionChart({ vm }: { vm: ReturnType<typeof useStatsViewModel> }) {
  const { t } = useTranslation(["stats", "cycle"]);
  const config = Object.fromEntries(
    WEEK_KEYS.map((k, i) => [k, { label: t("cycle:week", { n: i + 1 }), color: `var(--series-${i + 1})` }]),
  ) satisfies ChartConfig;
  const data = vm.repetition.map((r) => ({ name: r.name, total: r.total, w1: r.weeks[0], w2: r.weeks[1], w3: r.weeks[2], w4: r.weeks[3] }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("stats:repetition.title")}</CardTitle>
        <CardDescription>
          {vm.source === "MINE" ? t("stats:repetition.subtitleMine") : t("stats:repetition.subtitle")}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* Estado do gráfico: personagens das Metas ou das equipes que o usuário montou. */}
        <ToggleGroup
          type="single"
          variant="outline"
          value={vm.source}
          onValueChange={(v) => v && vm.setSource(v as RepetitionSource)}
          aria-label={t("stats:repetition.source")}
          className="w-full sm:w-fit"
        >
          <ToggleGroupItem value="META" className="flex-1 font-heading tracking-wider uppercase data-[state=on]:text-energy">
            {t("stats:repetition.sourceMeta")}
          </ToggleGroupItem>
          <ToggleGroupItem value="MINE" className="flex-1 font-heading tracking-wider uppercase data-[state=on]:text-brazil-green">
            {t("stats:repetition.sourceMine")}
          </ToggleGroupItem>
        </ToggleGroup>
        <div className="flex flex-wrap items-center gap-3">
          <ToggleGroup
            type="single"
            size="sm"
            variant="outline"
            value={vm.mode}
            onValueChange={(v) => v && vm.setMode(v as StatsMode)}
            aria-label={t("stats:repetition.mode")}
          >
            {(["ALL", "BAX", "BAL", "BAI"] as const).map((m) => (
              <ToggleGroupItem key={m} value={m}>
                {m === "ALL" ? t("cycle:all") : m}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          {vm.source === "META" && (
            <Field orientation="horizontal" className="w-auto">
              <Switch id="with-alt" checked={vm.includeAlternatives} onCheckedChange={vm.setIncludeAlternatives} />
              <FieldLabel htmlFor="with-alt">{t("stats:repetition.withAlt")}</FieldLabel>
            </Field>
          )}
        </div>
        {data.length === 0 ? (
          <EmptyMine text={t("stats:repetition.emptyMine")} />
        ) : (
          <Tabs defaultValue="chart">
            <TabsList>
              <TabsTrigger value="chart">{t("stats:chart")}</TabsTrigger>
              <TabsTrigger value="table">{t("stats:table")}</TabsTrigger>
            </TabsList>
            <TabsContent value="chart">
              <ChartContainer config={config} className={`aspect-auto w-full ${SEGMENT_GAP}`} style={{ height: Math.max(160, data.length * BAR_ROW_PX + 64) }}>
                <BarChart data={data} layout="vertical" margin={{ left: 4, right: 16 }} barCategoryGap={4}>
                  <CartesianGrid horizontal={false} strokeWidth={1} />
                  <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" width={112} tickLine={false} axisLine={false} interval={0} tick={{ fontSize: 11 }} />
                  <ChartTooltip cursor={{ fillOpacity: 0.3 }} content={<ChartTooltipContent indicator="dot" />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  {WEEK_KEYS.map((k, i) => (
                    <Bar
                      key={k}
                      dataKey={k}
                      stackId="weeks"
                      fill={`var(--color-${k})`}
                      isAnimationActive={false}
                      maxBarSize={20}
                      radius={i === WEEK_KEYS.length - 1 ? [0, 4, 4, 0] : 0}
                    />
                  ))}
                </BarChart>
              </ChartContainer>
            </TabsContent>
            <TabsContent value="table">
              <div className="max-h-[28rem] overflow-auto rounded-md ring-1 ring-foreground/10">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("stats:repetition.agent")}</TableHead>
                      {WEEK_KEYS.map((k, i) => (
                        <TableHead key={k} className="text-right">
                          S{i + 1}
                        </TableHead>
                      ))}
                      <TableHead className="text-right">{t("stats:total")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vm.repetition.map((r) => (
                      <TableRow key={r.agentId}>
                        <TableCell className="font-medium">{r.name}</TableCell>
                        {r.weeks.map((w, i) => (
                          <TableCell key={i} className="text-right tabular-nums">
                            {w}
                          </TableCell>
                        ))}
                        <TableCell className="text-right font-semibold tabular-nums">{r.total}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        )}
        {vm.repetitionTotal > vm.top && (
          <Button variant="outline" size="sm" className="self-start" onClick={() => vm.setShowAll(!vm.showAll)}>
            {vm.showAll ? t("stats:showTop", { n: vm.top }) : t("stats:showAll", { n: vm.repetitionTotal })}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyMine({ text }: { text: string }) {
  const { t } = useTranslation("stats");
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-dashed p-4 text-sm text-muted-foreground">
      {text}
      <Button asChild size="sm" variant="outline">
        <Link href="/">{t("myTeams.build")}</Link>
      </Button>
    </div>
  );
}

/** Todas as equipes do usuário, agrupadas pela composição: as mais repetidas primeiro. */
function MyTeamsCard({ vm }: { vm: ReturnType<typeof useStatsViewModel> }) {
  const { t } = useTranslation(["stats", "common"]);
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("stats:myTeams.title")}</CardTitle>
        <CardDescription>{t("stats:myTeams.subtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        {!vm.hydrated ? (
          <Skeleton className="h-32 w-full" />
        ) : vm.compositions.length === 0 ? (
          <EmptyMine text={t("stats:myTeams.empty")} />
        ) : (
          <ul className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
            {vm.compositions.map((c) => (
              <li key={c.id} className="flex flex-col gap-1.5">
                <TeamStrip
                  label={t("stats:myTeams.times", { count: c.usages.length })}
                  tone="mine"
                  members={c.members}
                  catalog={vm.catalog}
                />
                <div className="flex flex-wrap gap-1">
                  {c.usages.map((u) => (
                    <Badge key={`${u.mode}-${u.day}`} variant={u.mode === "BAI" ? "brazil" : "outline"}>
                      {u.day ? `${u.mode} · ${t("common:day", { number: u.day })}` : u.mode}
                    </Badge>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function CtpChart({ vm }: { vm: ReturnType<typeof useStatsViewModel> }) {
  const { t } = useTranslation(["stats", "common", "roster"]);
  const config = Object.fromEntries(
    CTP_QUALITIES.map((q, i) => [q, { label: t(`common:quality.${q}`), color: `var(--series-${i + 1})` }]),
  ) satisfies ChartConfig;
  const data = vm.usage.map((r) => ({ name: t(`common:ctp.${r.type}`), ...r.counts, total: r.total }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("stats:ctp.title")}</CardTitle>
        <CardDescription>{t("stats:ctp.subtitle", { equipped: vm.equipped, owned: vm.ownedAgents })}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {!vm.hydrated ? (
          <Skeleton className="h-64 w-full" />
        ) : vm.equipped === 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            {t("stats:ctp.empty")}
            <Button asChild size="sm" variant="outline">
              <Link href="/meu-elenco">{t("roster:ctpTitle")}</Link>
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="chart">
            <TabsList>
              <TabsTrigger value="chart">{t("stats:chart")}</TabsTrigger>
              <TabsTrigger value="table">{t("stats:table")}</TabsTrigger>
            </TabsList>
            <TabsContent value="chart">
              <ChartContainer config={config} className={`aspect-auto h-72 w-full ${SEGMENT_GAP}`}>
                <BarChart data={data} margin={{ left: -16, right: 8 }}>
                  <CartesianGrid vertical={false} strokeWidth={1} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} interval={0} tick={{ fontSize: 11 }} angle={-30} textAnchor="end" height={56} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                  <ChartTooltip cursor={{ fillOpacity: 0.3 }} content={<ChartTooltipContent indicator="dot" />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  {CTP_QUALITIES.map((q, i) => (
                    <Bar
                      key={q}
                      dataKey={q}
                      stackId="quality"
                      fill={`var(--color-${q})`}
                      isAnimationActive={false}
                      maxBarSize={24}
                      radius={i === CTP_QUALITIES.length - 1 ? [4, 4, 0, 0] : 0}
                    />
                  ))}
                </BarChart>
              </ChartContainer>
            </TabsContent>
            <TabsContent value="table">
              <div className="overflow-x-auto rounded-md ring-1 ring-foreground/10">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>CTP</TableHead>
                      {CTP_QUALITIES.map((q) => (
                        <TableHead key={q} className="text-right">
                          {t(`common:quality.${q}`)}
                        </TableHead>
                      ))}
                      <TableHead>{t("stats:ctp.agents")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vm.usage.map((r) => (
                      <TableRow key={r.type}>
                        <TableCell className="font-medium">{t(`common:ctp.${r.type}`)}</TableCell>
                        {CTP_QUALITIES.map((q) => (
                          <TableCell key={q} className="text-right tabular-nums">
                            {r.counts[q]}
                          </TableCell>
                        ))}
                        <TableCell className="min-w-48 text-xs whitespace-normal text-muted-foreground">
                          {r.agents.map((a) => `${a.name} (${t(`common:quality.${a.quality}`)})`).join(", ") || "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}

export function StatsView() {
  const { t } = useTranslation("stats");
  const vm = useStatsViewModel();
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-bold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <HelpHint title={t("title")}>
          <p>{t("help.text1")}</p>
          <p>{t("help.text2")}</p>
        </HelpHint>
      </div>
      <QueryState isLoading={vm.isLoading} isError={vm.isError} retry={vm.retry} skeleton={<Skeleton className="h-96 w-full" />}>
        <div className="grid gap-6 xl:grid-cols-2">
          <RepetitionChart vm={vm} />
          <CtpChart vm={vm} />
        </div>
        <MyTeamsCard vm={vm} />
      </QueryState>
    </div>
  );
}
