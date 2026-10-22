import { useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "next-i18next/pages";
import { getCycle } from "@/models/api/cycle";
import { ctpColor } from "@/models/domain/ctpColors";
import { dayCtpId } from "@/models/rules/ctpAssign";
import { ownedAgentIds, rosterAgents, uniformsInTeams } from "@/models/rules/roster";
import { agentRepetition, ctpsOfUses, ctpUsage, myAgentRepetition, myTeamCompositions, type StatsMode } from "@/models/rules/stats";
import { renderStatsHtml } from "@/models/rules/statsExport";
import { useSelectionsStore } from "./stores/selectionsStore";
import { useCatalogViewModel } from "./useCatalogViewModel";

const TOP = 15;

/** Origem da repetição: equipes Meta dos curadores ou equipes montadas pelo usuário. */
export type RepetitionSource = "META" | "MINE";

/**
 * Estatísticas: repetição dos personagens (nas Metas ou nas equipes do usuário), as equipes do
 * usuário agrupadas pelas que mais se repetem e os CTPs equipados.
 */
export function useStatsViewModel() {
  const { t } = useTranslation(["stats", "cycle", "common"]);
  const { locale } = useRouter();
  const cycle = useQuery({ queryKey: ["cycle"], queryFn: getCycle });
  const catalog = useCatalogViewModel();
  const { doc, hydrated } = useSelectionsStore();
  const [mode, setMode] = useState<StatsMode>("ALL");
  const [source, setSource] = useState<RepetitionSource>("META");
  const [includeAlternatives, setIncludeAlternatives] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const agentOf = (u: string) => catalog.uniformById(u)?.agent;
  const repetition = useMemo(
    () =>
      source === "MINE"
        ? myAgentRepetition(doc.teams, agentOf, mode, (pick, agentId) => dayCtpId(pick, doc.equipment, agentId))
        : cycle.data
          ? agentRepetition(cycle.data, agentOf, { mode, includeAlternatives })
          : [],
    // agentOf é derivado de catalog.agents
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [source, doc.teams, doc.equipment, cycle.data, catalog.agents, mode, includeAlternatives],
  );

  const compositions = useMemo(
    () => myTeamCompositions(doc.teams, agentOf, mode),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [doc.teams, catalog.agents, mode],
  );

  // Personagens do jogador, contados como em Meu elenco. Na escolha livre (sem elenco), todos.
  const available = useMemo(() => {
    const used = uniformsInTeams(cycle.data);
    return doc.freePick
      ? new Set(rosterAgents(catalog.agents, used).map((a) => a.id))
      : ownedAgentIds(catalog.agents, new Set(doc.roster.ownedUniformIds), used);
  }, [cycle.data, catalog.agents, doc.freePick, doc.roster.ownedUniformIds]);

  // CTPs 1 e 2, só de personagens disponíveis: um CTP que ficou num personagem desmarcado não conta.
  const usage = useMemo(
    () =>
      ctpUsage(
        ([[1, doc.equipment?.ctpByAgent], [2, doc.equipment?.ctp2ByAgent]] as const).flatMap(([slot, map]) =>
          Object.entries(map ?? {})
            .filter(([agentId]) => available.has(agentId))
            .map(([agentId, ctpId]) => ({ agentId, ctpId, slot })),
        ),
        (id) => catalog.ctpById(id),
        (agentId) => catalog.agents.find((a) => a.id === agentId)?.name,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [doc.equipment, available, catalog.agents, catalog.ctps],
  );

  const ownedAgents = available.size;
  const equipped = usage.reduce((n, r) => n + r.total, 0);
  const withCtp = new Set(usage.flatMap((r) => r.agents.map((a) => a.agentId))).size;

  /** Foto do personagem: a do traje padrão (ou do primeiro com imagem). */
  const portraitOf = (agentId: string) => {
    const agent = catalog.agents.find((a) => a.id === agentId);
    return (agent?.uniforms.find((u) => u.slug === "padrao") ?? agent?.uniforms[0])?.portrait || null;
  };
  const ctpLabel = (ctpId: string | null) => {
    const ctp = catalog.ctpById(ctpId);
    return ctp ? `${t(`common:ctp.${ctp.type}`)} · ${t(`common:quality.${ctp.quality}`)}` : null;
  };
  const absolute = (path: string | null) => (path ? new URL(path, window.location.origin).toString() : null);

  /** Estatísticas da origem e do modo da tela (todos os personagens), num HTML: do mais usado para o menos. */
  const exportHtml = () => {
    const now = new Date();
    const date = new Intl.DateTimeFormat(locale, { dateStyle: "short", timeStyle: "short" }).format(now);
    const rows = repetition.map((r) => ({
      name: r.name,
      portrait: absolute(portraitOf(r.agentId)),
      total: r.total,
      weeks: r.weeks,
      ctps: ctpsOfUses(r.uses).flatMap(({ ctpId, count }) => {
        const ctp = catalog.ctpById(ctpId);
        return ctp ? [{ label: ctpLabel(ctpId)!, image: absolute(ctp.imagePath || null), color: ctpColor(ctp)!, count }] : [];
      }),
      days: r.uses.map((u) => ({ mode: u.mode, day: u.day, ctp: ctpLabel(u.ctpId) })),
    }));
    const modeLabel = mode === "ALL" ? t("cycle:all") : mode;
    const html = renderStatsHtml(
      rows,
      {
        rank: t("stats:export.rank"),
        agent: t("stats:repetition.agent"),
        ctps: t("stats:repetition.ctps"),
        total: t("stats:total"),
        days: t("stats:repetition.days"),
        weeks: [1, 2, 3, 4].map((n) => `S${n}`),
        dayShort: (day) => t("common:day", { number: day }),
        noCtp: t("stats:repetition.noCtp"),
        empty: source === "MINE" ? t("stats:repetition.emptyMine") : "—",
        generatedAt: t("stats:export.generatedAt", { date }),
      },
      {
        title: doc.nickname ? t("stats:export.titleOf", { name: doc.nickname }) : t("stats:export.title"),
        subtitle: t(source === "MINE" ? "stats:export.subtitleMine" : "stats:export.subtitleMeta", { mode: modeLabel }),
        lang: locale ?? "pt-BR",
      },
    );
    const url = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `estatisticas-${source === "MINE" ? "minhas-equipes" : "metas"}-${mode.toLowerCase()}-${now.toISOString().slice(0, 10)}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return {
    catalog,
    mode,
    setMode,
    source,
    setSource,
    compositions,
    includeAlternatives,
    setIncludeAlternatives,
    showAll,
    setShowAll,
    repetition: showAll ? repetition : repetition.slice(0, TOP),
    repetitionTotal: repetition.length,
    top: TOP,
    usage,
    equipped,
    withCtp,
    ownedAgents,
    portraitOf,
    exportHtml,
    canExport: repetition.length > 0,
    hydrated,
    isLoading: cycle.isLoading || catalog.isLoading,
    isError: cycle.isError || catalog.isError,
    retry: () => {
      cycle.refetch();
      catalog.refetch();
    },
  };
}
