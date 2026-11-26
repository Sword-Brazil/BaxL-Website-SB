import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "next-i18next/pages";
import { toast } from "sonner";
import { getRotations } from "@/models/api/rotations";
import type { DayMode, SeasonId } from "@/models/domain/enums";
import type { CycleModeDay, MetaTeam, Rotation, Season } from "@/models/domain/types";
import { buildDayMessage, memberName, type DayMessageRotations } from "@/models/rules/dayMessage";
import { pick } from "@/models/rules/localize";
import { rotationVideos } from "@/models/rules/scoringModes";
import type { CatalogViewModel } from "./useCatalogViewModel";
import { useContentLang } from "./useContentLang";
import { ROTATIONS_KEY } from "./useRotationsViewModel";

/** Rotações que valem para o traje: as dele e as de todos os trajes do personagem. */
const rotationsFor = (all: Rotation[], agentId: string, uniformId: string) =>
  all.filter((r) => r.agentId === agentId && (!r.uniformId || r.uniformId === uniformId)).sort((a, b) => a.position - b.position);

/** "Copiar mensagem do dia": BAX/BAL de um dia, no formato do grupo do WhatsApp. */
export function useDayMessageViewModel(catalog: CatalogViewModel) {
  const { t } = useTranslation(["cycle", "common"]);
  const lang = useContentLang();
  const qc = useQueryClient();

  const nameOf = (uniformId: string) => {
    const ref = catalog.uniformById(uniformId);
    if (!ref) return null;
    const agent = pick(ref.agent.name, ref.agent.nameEn, lang);
    return { ref, agent, full: memberName(agent, pick(ref.uniform.name, ref.uniform.nameEn, lang)) };
  };

  const build = (mode: DayMode, day: CycleModeDay, season: SeasonId | null, rotations: Rotation[]) => {
    // Vídeo da equipe; sem ele, o da rotação do Causador de Dano no modo (e na temporada).
    const fallbackVideo = (team: MetaTeam) => {
      for (const m of team.members.filter((x) => x.isDamageDealer)) {
        const ref = catalog.uniformById(m.uniformId);
        if (!ref) continue;
        for (const r of rotationsFor(rotations, ref.agent.id, m.uniformId)) {
          const videos = rotationVideos(r, season);
          const url = (videos.find((v) => v.mode === mode) ?? videos.find((v) => v.mode === null))?.url;
          if (url) return url;
        }
      }
      return null;
    };

    const teams = day.metaTeams.map((team) => ({
      videoUrl: team.videoUrl ?? fallbackVideo(team),
      members: team.members.flatMap((m) => {
        const n = nameOf(m.uniformId);
        if (!n) return [];
        const striker = m.isDamageDealer && m.strikerUniformId ? nameOf(m.strikerUniformId) : null;
        return [
          {
            slot: m.slot,
            name: n.full,
            agentName: n.agent,
            female: n.ref.uniform.gender === "FEMALE",
            isDamageDealer: m.isDamageDealer,
            strikerName: striker?.agent ?? null,
          },
        ];
      }),
    }));

    // Cada Causador de Dano uma vez, na ordem das equipes.
    const seen = new Set<string>();
    const rotationBlocks: DayMessageRotations[] = day.metaTeams.flatMap((team) =>
      team.members.flatMap((m) => {
        const n = m.isDamageDealer && !seen.has(m.uniformId) ? nameOf(m.uniformId) : null;
        if (!n) return [];
        seen.add(m.uniformId);
        return [
          {
            name: n.full,
            rotations: rotationsFor(rotations, n.ref.agent.id, m.uniformId).map((r) => ({
              title: pick(r.title, r.titleEn, lang),
              sequence: r.sequence,
              description: pick(r.description, r.descriptionEn, lang),
            })),
          },
        ];
      }),
    );

    return { teams, rotationBlocks };
  };

  return {
    /** Monta a mensagem e copia; avisa se o navegador não deixar copiar. */
    copy: async (mode: DayMode, day: CycleModeDay, season: Season | null) => {
      const text = qc.fetchQuery({ queryKey: ROTATIONS_KEY, queryFn: getRotations }).then((rotations) => {
        const { teams, rotationBlocks } = build(mode, day, season?.id ?? null, rotations);
        return buildDayMessage({
          mode,
          effect: season ? t(`common:effects.${season[mode]}`) : null,
          criteria: day.criteria.map((c) => t(`common:values.${c.value}`)),
          teams,
          rotations: rotationBlocks,
          labels: {
            bestTeams: t("cycle:message.bestTeams"),
            rotation: t("cycle:message.rotation"),
            leader: t("cycle:message.leader"),
            and: t("cycle:message.and"),
            meta: t("cycle:meta"),
            striker: (striker, target, female) => t("cycle:message.striker", { striker, target, context: female ? "female" : undefined }),
          },
        });
      });
      try {
        // Safari só deixa copiar no próprio clique: o ClipboardItem aceita o texto ainda carregando.
        if (typeof ClipboardItem !== "undefined" && navigator.clipboard.write) {
          await navigator.clipboard.write([new ClipboardItem({ "text/plain": text.then((v) => new Blob([v], { type: "text/plain" })) })]);
        } else {
          await navigator.clipboard.writeText(await text);
        }
        toast.success(t("cycle:message.copied"));
      } catch {
        toast.error(t("cycle:message.copyFailed"));
      }
    },
  };
}
