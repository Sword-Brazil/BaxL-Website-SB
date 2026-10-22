import Link from "next/link";
import { useTranslation } from "next-i18next/pages";
import { ChevronDownIcon, DownloadIcon } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MODE_VISUALS } from "@/views/shared/modeVisuals";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { CTP_QUALITIES } from "@/models/domain/enums";
import { ctpsOfUses, type AgentUse, type CtpUsage, type StatsMode } from "@/models/rules/stats";
import { useStatsViewModel, type RepetitionSource } from "@/viewmodels/useStatsViewModel";
import { HelpHint } from "@/views/layout/HelpHint";
import { CtpBadge } from "@/views/shared/CtpBadge";
import { QueryState } from "@/views/shared/QueryState";
import { TeamStrip } from "@/views/shared/TeamStrip";

const WEEK_KEYS = ["w1", "w2", "w3", "w4"] as const;
const BAR_ROW_PX = 28;
/** 2px de superfície entre segmentos empilhados (via CSS: o `stroke` do Recharts vira a cor da legenda). */
const SEGMENT_GAP = "[&_.recharts-bar-rectangle_path]:stroke-card [&_.recharts-bar-rectangle_path]:[stroke-width:2px]";

type StatsVm = ReturnType<typeof useStatsViewModel>;

/** Foto pequena do personagem (iniciais sem foto). */
function AgentFace({ vm, agentId, name, className }: { vm: StatsVm; agentId: string; name: string; className?: string }) {
  return (
    <Avatar className={`chamfer-sm size-8 shrink-0 rounded-none after:hidden ${className ?? ""}`}>
      <AvatarImage src={vm.portraitOf(agentId) ?? undefined} alt="" loading="lazy" decoding="async" className="rounded-none object-cover" />
      <AvatarFallback className="rounded-none bg-secondary font-heading text-[0.6rem]">{name.slice(0, 2).toUpperCase()}</AvatarFallback>
    </Avatar>
  );
}

/** Dias em que o personagem aparece, num menu: modo, dia e o CTP usado em cada um. */
function DaysMenu({ vm, uses }: { vm: StatsVm; uses: AgentUse[] }) {
  const { t } = useTranslation(["stats", "common"]);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="xs" variant="outline" className="gap-1">
          {t("stats:repetition.days", { count: uses.length })}
          <ChevronDownIcon data-icon="inline-end" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="max-h-80 w-72 overflow-y-auto p-2">
        <ul className="flex flex-col gap-1">
          {uses.map((u, i) => (
            <li key={i} className="flex items-center justify-between gap-2 text-xs">
              <Badge variant={MODE_VISUALS[u.mode].badge}>
                {u.mode} · {t("common:day", { number: u.day })}
              </Badge>
              {u.ctpId ? <CtpBadge ctp={vm.catalog.ctpById(u.ctpId)} size="xs" /> : <span className="text-muted-foreground">—</span>}
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

/** Personagens com um tipo de CTP: fotos empilhadas e, no menu, foto + nome + o CTP (e o slot). */
function CtpAgentsMenu({ vm, row }: { vm: StatsVm; row: CtpUsage }) {
  const { t } = useTranslation(["stats", "common"]);
  if (!row.agents.length) return <span className="text-muted-foreground">—</span>;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="flex items-center gap-2 rounded-md px-1 py-0.5 text-xs hover:bg-accent/40">
          <span className="flex -space-x-2">
            {row.agents.slice(0, 4).map((a) => (
              <AgentFace key={`${a.agentId}-${a.slot}`} vm={vm} agentId={a.agentId} name={a.name} className="size-7 ring-2 ring-card" />
            ))}
          </span>
          <span className="whitespace-nowrap text-muted-foreground">{t("stats:ctp.agentsCount", { count: row.agents.length })}</span>
          <ChevronDownIcon className="size-3.5 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="max-h-80 w-72 overflow-y-auto p-2">
        <ul className="flex flex-col gap-1.5">
          {row.agents.map((a) => (
            <li key={`${a.agentId}-${a.slot}`} className="flex items-center gap-2 text-sm">
              <AgentFace vm={vm} agentId={a.agentId} name={a.name} />
              <span className="min-w-0 flex-1 truncate font-medium">{a.name}</span>
              <span className="text-[0.65rem] text-muted-foreground">{t("common:ctpSlot.label", { n: a.slot })}</span>
              <CtpBadge ctp={vm.catalog.ctpById(a.ctpId)} size="sm" />
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

function RepetitionChart({ vm }: { vm: StatsVm }) {
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
          // Grade de 2 colunas iguais: cada uma do tamanho do texto mais longo (com flex-1 num grupo
          // w-fit, "Minhas equipes" ficava com metade da soma dos textos e estourava no PC).
          className="grid w-full grid-cols-2 sm:w-fit"
        >
          <ToggleGroupItem value="META" className="px-4 font-heading tracking-wider uppercase data-[state=on]:text-energy">
            {t("stats:repetition.sourceMeta")}
          </ToggleGroupItem>
          <ToggleGroupItem value="MINE" className="px-4 font-heading tracking-wider uppercase data-[state=on]:text-brazil-green">
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
              <ToggleGroupItem key={m} value={m} className={m === "ALL" ? undefined : MODE_VISUALS[m].active}>
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
          {/* Exporta todos os personagens da origem e do modo escolhidos, com CTPs e dias. */}
          <Button size="sm" variant="outline" className="ml-auto" disabled={!vm.canExport} onClick={vm.exportHtml}>
            <DownloadIcon data-icon="inline-start" />
            {t("stats:repetition.export")}
          </Button>
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
                      <TableHead>{t("stats:repetition.ctps")}</TableHead>
                      {WEEK_KEYS.map((k, i) => (
                        <TableHead key={k} className="text-right">
                          S{i + 1}
                        </TableHead>
                      ))}
                      <TableHead className="text-right">{t("stats:total")}</TableHead>
                      <TableHead className="text-right">{t("stats:repetition.days")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vm.repetition.map((r) => (
                      <TableRow key={r.agentId}>
                        <TableCell>
                          <span className="flex items-center gap-2 font-medium">
                            <AgentFace vm={vm} agentId={r.agentId} name={r.name} />
                            {r.name}
                          </span>
                        </TableCell>
                        <TableCell>
                          {/* CTPs que o personagem usa, do mais usado para o menos. */}
                          <span className="flex items-center gap-1">
                            {ctpsOfUses(r.uses).map(({ ctpId }) => (
                              <CtpBadge key={ctpId} ctp={vm.catalog.ctpById(ctpId)} size="xs" />
                            ))}
                          </span>
                        </TableCell>
                        {r.weeks.map((w, i) => (
                          <TableCell key={i} className="text-right tabular-nums">
                            {w}
                          </TableCell>
                        ))}
                        <TableCell className="text-right font-semibold tabular-nums">{r.total}</TableCell>
                        <TableCell className="text-right">
                          <DaysMenu vm={vm} uses={r.uses} />
                        </TableCell>
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
                    <Badge key={`${u.mode}-${u.day}`} variant={MODE_VISUALS[u.mode].badge}>
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
        <CardDescription>{t("stats:ctp.subtitle", { equipped: vm.equipped, withCtp: vm.withCtp, owned: vm.ownedAgents })}</CardDescription>
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
                        <TableCell>
                          <CtpAgentsMenu vm={vm} row={r} />
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
