import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import type { DayMode, Mode, Slot } from "@/models/domain/enums";
import { SLOTS } from "@/models/domain/enums";
import type { Criterion, MetaTeam } from "@/models/domain/types";
import { renderTeamsHtml, type ExportBlock, type ExportMember, type ExportTeam } from "@/models/rules/teamsExport";
import type { UserTeam } from "@/models/schemas/selections";
import { useSelectionsStore } from "./stores/selectionsStore";
import type { CycleViewModel } from "./useCycleViewModel";

/**
 * Exporta as equipes dos dias mostrados na tela (respeita o filtro de semana): Meta,
 * Alternativas e a equipe do jogador, num documento HTML com tabela.
 */
export function useTeamsExportViewModel(vm: CycleViewModel) {
  const { t } = useTranslation(["cycle", "common"]);
  const { locale } = useRouter();
  const nickname = useSelectionsStore((s) => s.doc.nickname);

  const ctpName = (ctpId: string | null | undefined) => {
    const ctp = vm.catalog.ctpById(ctpId);
    if (!ctp) return null;
    return `${t(`common:ctp.${ctp.type}`)} · ${t(`common:quality.${ctp.quality}`)}`;
  };

  const member = (uniformId: string, opts: { ctpId?: string | null; damageDealer?: boolean; mine?: boolean }): ExportMember | undefined => {
    const ref = vm.catalog.uniformById(uniformId);
    if (!ref) return undefined;
    const ctpId = opts.mine ? (vm.equippedCtpOf(ref.agent.id)?.id ?? null) : opts.ctpId;
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
      label: team.isPrimary ? t("cycle:meta") : (team.label ?? t("cycle:alternative")),
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
        const em = pick ? member(pick.uniformId, { mine: true }) : undefined;
        return em ? [[slot, em]] : [];
      }),
    ) as Partial<Record<Slot, ExportMember>>;
    return Object.keys(members).length ? [{ kind: "MINE", label: t("cycle:mine"), members }] : [];
  };

  const restriction = (criteria: Criterion[]) =>
    criteria.length ? criteria.map((c) => t(`common:values.${c.value}`)).join(" + ") : t("common:restriction.none");

  const blocks = (): ExportBlock[] =>
    vm.days.flatMap((day) => {
      const weekday = t(`common:weekdays.${day.weekday}`);
      if (day.isBai) {
        return [
          {
            day: day.number,
            weekday,
            mode: "BAI" as Mode,
            restriction: t("cycle:export.allReleased"),
            teams: [...metaTeams(vm.bai?.metaTeams ?? []), ...mine(vm.userTeam("BAI", day.number))],
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
          teams: [...metaTeams(data?.metaTeams ?? []), ...mine(vm.userTeam(mode, day.number))],
        };
      });
    });

  return {
    canExport: !vm.isLoading && vm.days.length > 0,
    exportHtml: () => {
      const now = new Date();
      const date = new Intl.DateTimeFormat(locale, { dateStyle: "short", timeStyle: "short" }).format(now);
      const weekLabel = vm.week === "all" ? t("cycle:all") : t("cycle:week", { n: vm.week });
      const html = renderTeamsHtml(
        blocks(),
        {
          day: t("cycle:export.day"),
          mode: t("cycle:export.mode"),
          restriction: t("cycle:export.restriction"),
          team: t("cycle:export.team"),
          slots: { SOLO: t("common:team.slots.SOLO"), SUPPORT_1: t("common:team.slots.SUPPORT_1"), SUPPORT_2: t("common:team.slots.SUPPORT_2") },
          damageDealer: t("common:team.damageDealer"),
          empty: "—",
          noTeams: t("cycle:noTeam"),
          generatedAt: t("cycle:export.generatedAt", { date }),
        },
        {
          title: nickname ? t("cycle:export.titleOf", { name: nickname }) : t("cycle:export.title"),
          subtitle: t("cycle:export.subtitle", { week: weekLabel }),
          lang: locale ?? "pt-BR",
        },
      );
      const url = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `equipes-batalha-de-alianca-${now.toISOString().slice(0, 10)}.html`;
      a.click();
      URL.revokeObjectURL(url);
    },
  };
}
