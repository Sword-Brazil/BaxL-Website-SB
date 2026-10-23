import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import type { DayMode, Mode, Slot } from "@/models/domain/enums";
import { SLOTS } from "@/models/domain/enums";
import type { Criterion, MetaTeam } from "@/models/domain/types";
import { teamLabel } from "@/models/rules/localize";
import { renderTeamsHtml, type ExportBlock, type ExportMember, type ExportTeam } from "@/models/rules/teamsExport";
import { useContentLang } from "./useContentLang";
import type { UserTeam } from "@/models/schemas/selections";
import { useSelectionsStore } from "./stores/selectionsStore";
import type { CycleViewModel } from "./useCycleViewModel";

/** Tabela completa (Meta, Alternativas e a equipe do jogador), só as Metas ou só as equipes do jogador. */
export type ExportScope = "all" | "meta" | "mine";

const SUBTITLE: Record<ExportScope, string> = {
  all: "cycle:export.subtitle",
  meta: "cycle:export.subtitleMeta",
  mine: "cycle:export.subtitleMine",
};
const FILE_PREFIX: Record<ExportScope, string> = { all: "equipes", meta: "metas", mine: "minhas-equipes" };

/**
 * Exporta as equipes dos dias mostrados na tela (respeita o filtro de semana) num documento HTML
 * com tabela.
 */
export function useTeamsExportViewModel(vm: CycleViewModel) {
  const { t } = useTranslation(["cycle", "common"]);
  const lang = useContentLang();
  const { locale } = useRouter();
  const nickname = useSelectionsStore((s) => s.doc.nickname);

  const ctpName = (ctpId: string | null | undefined) => {
    const ctp = vm.catalog.ctpById(ctpId);
    if (!ctp) return null;
    return `${t(`common:ctp.${ctp.type}`)} · ${t(`common:quality.${ctp.quality}`)}`;
  };

  const member = (uniformId: string, opts: { ctpId?: string | null; damageDealer?: boolean }): ExportMember | undefined => {
    const ref = vm.catalog.uniformById(uniformId);
    if (!ref) return undefined;
    const ctpId = opts.ctpId;
    return {
      name: ref.agent.name,
      uniform: ref.uniform.slug === "padrao" ? null : ref.uniform.name,
      ctp: ctpName(ctpId),
      damageDealer: !!opts.damageDealer,
      portrait: ref.uniform.portrait ? new URL(ref.uniform.portrait, window.location.origin).toString() : null,
    };
  };

  const metaTeams = (teams: MetaTeam[]): ExportTeam[] =>
    teams.map((team) => ({
      kind: team.isPrimary ? "META" : "ALT",
      label: team.isPrimary ? t("cycle:meta") : (teamLabel(team.label, team.labelEn, lang) ?? t("cycle:alternative")),
      members: Object.fromEntries(
        team.members.flatMap((m) => {
          const em = member(m.uniformId, { ctpId: m.ctpId, damageDealer: m.isDamageDealer });
          return em ? [[m.slot, em]] : [];
        }),
      ) as Partial<Record<Slot, ExportMember>>,
    }));

  const mine = (team: UserTeam | null): ExportTeam[] => {
    if (!team) return [];
    const members = Object.fromEntries(
      SLOTS.flatMap((slot) => {
        const pick = team[slot];
        // Minha equipe: o CTP do slot (1 ou 2) que o personagem usa no dia.
        const em = pick ? member(pick.uniformId, { ctpId: vm.dayCtpIdOf(pick) }) : undefined;
        return em ? [[slot, em]] : [];
      }),
    ) as Partial<Record<Slot, ExportMember>>;
    return Object.keys(members).length ? [{ kind: "MINE", label: t("cycle:mine"), members }] : [];
  };

  const teamsOf = (scope: ExportScope, meta: MetaTeam[], own: UserTeam | null) => [
    ...(scope !== "mine" ? metaTeams(meta) : []),
    ...(scope !== "meta" ? mine(own) : []),
  ];

  const restriction = (criteria: Criterion[]) =>
    criteria.length ? criteria.map((c) => t(`common:values.${c.value}`)).join(" + ") : t("common:restriction.none");

  const blocks = (scope: ExportScope): ExportBlock[] =>
    vm.days.flatMap((day) => {
      const weekday = t(`common:weekdays.${day.weekday}`);
      if (day.isBai) {
        return [
          {
            day: day.number,
            weekday,
            mode: "BAI" as Mode,
            restriction: t("cycle:export.allReleased"),
            teams: teamsOf(scope, vm.bai?.metaTeams ?? [], vm.userTeam("BAI", day.number)),
          },
        ];
      }
      return (["BAX", "BAL"] as DayMode[]).map((mode) => {
        const data = mode === "BAX" ? day.bax : day.bal;
        return {
          day: day.number,
          weekday,
          mode,
          restriction: restriction(data?.criteria ?? []),
          teams: teamsOf(scope, data?.metaTeams ?? [], vm.userTeam(mode, day.number)),
        };
      });
    });

  return {
    canExport: !vm.isLoading && vm.days.length > 0,
    exportHtml: (scope: ExportScope) => {
      const now = new Date();
      const date = new Intl.DateTimeFormat(locale, { dateStyle: "short", timeStyle: "short" }).format(now);
      const weekLabel = vm.week === "all" ? t("cycle:all") : t("cycle:week", { n: vm.week });
      const html = renderTeamsHtml(
        blocks(scope),
        {
          day: t("cycle:export.day"),
          mode: t("cycle:export.mode"),
          restriction: t("cycle:export.restriction"),
          team: t("cycle:export.team"),
          slots: { SOLO: t("common:team.slots.SOLO"), SUPPORT_1: t("common:team.slots.SUPPORT_1"), SUPPORT_2: t("common:team.slots.SUPPORT_2") },
          damageDealer: t("common:team.damageDealer"),
          empty: "—",
          noTeams: scope === "mine" ? t("cycle:export.noMine") : t("cycle:noTeam"),
          generatedAt: t("cycle:export.generatedAt", { date }),
        },
        {
          title: nickname ? t("cycle:export.titleOf", { name: nickname }) : t("cycle:export.title"),
          subtitle: t(SUBTITLE[scope], { week: weekLabel }),
          lang: locale ?? "pt-BR",
        },
      );
      const url = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `${FILE_PREFIX[scope]}-batalha-de-alianca-${now.toISOString().slice(0, 10)}.html`;
      a.click();
      URL.revokeObjectURL(url);
    },
  };
}
