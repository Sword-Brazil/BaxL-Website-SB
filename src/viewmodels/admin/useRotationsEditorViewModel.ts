import { useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminApi } from "@/models/api/admin";
import { ApiError } from "@/models/api/client";
import type { BossEffect, Mode } from "@/models/domain/enums";
import { effectiveScoringModes, sortModes } from "@/models/rules/scoringModes";
import type { Agent, Rotation } from "@/models/domain/types";
import { AgentRotationsSchema } from "@/models/schemas/admin";
import { searchNames } from "@/viewmodels/useCatalogViewModel";
import { ROTATIONS_KEY, useRotationsViewModel } from "@/viewmodels/useRotationsViewModel";

export interface RotationDraft {
  /** Chave só da tela (para a lista não se embaralhar ao reordenar). */
  key: string;
  uniformId: string | null;
  /** Temporada (efeito do chefe); null = todas. */
  effect: BossEffect | null;
  title: string;
  titleEn: string;
  sequence: string;
  description: string;
  descriptionEn: string;
  videoUrl: string;
  videoBax: string;
  videoBal: string;
  videoBai: string;
}

let nextKey = 0;
const newKey = () => `r${++nextKey}`;

const fromRotation = (r: Rotation): RotationDraft => ({
  key: newKey(),
  uniformId: r.uniformId,
  effect: r.effect,
  title: r.title ?? "",
  titleEn: r.titleEn ?? "",
  sequence: r.sequence,
  description: r.description ?? "",
  descriptionEn: r.descriptionEn ?? "",
  videoUrl: r.videoUrl ?? "",
  videoBax: r.videoBax ?? "",
  videoBal: r.videoBal ?? "",
  videoBai: r.videoBai ?? "",
});

/** Rotação nova; `from` copia traje e temporada da anterior (o mais comum é variar só um deles). */
const blankDraft = (from?: RotationDraft): RotationDraft => ({
  key: newKey(),
  uniformId: from?.uniformId ?? null,
  effect: from?.effect ?? null,
  title: "",
  titleEn: "",
  sequence: "",
  description: "",
  descriptionEn: "",
  videoUrl: "",
  videoBax: "",
  videoBal: "",
  videoBai: "",
});

/**
 * Aba "Rotações" (curadoria): rotações de cada personagem, por traje ou para todos, em texto
 * livre, com descrição e vídeo. `?personagem=<slug>` abre direto o personagem (vindo das Metas).
 */
export function useRotationsEditorViewModel(messages: { saved: string }) {
  const qc = useQueryClient();
  const router = useRouter();
  const rotations = useRotationsViewModel();
  const { catalog } = rotations;
  const [search, setSearch] = useState("");
  const [onlyWithRotations, setOnlyWithRotations] = useState(false);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [drafts, setDrafts] = useState<RotationDraft[]>([]);
  /** Modos em que pontua: automático (pelas equipes Meta) ou os escolhidos aqui. */
  const [scoring, setScoring] = useState<{ auto: boolean; modes: Mode[] }>({ auto: true, modes: [] });
  const [error, setError] = useState<string | null>(null);

  const open = (a: Agent) => {
    setError(null);
    setAgent(a);
    setScoring({ auto: a.scoringAuto, modes: a.scoringModes });
    const current = rotations.rotationsOf(a.id).map(fromRotation);
    setDrafts(current.length ? current : [blankDraft()]);
  };

  // Vindo do editor de Metas: abre o personagem pedido assim que os dados chegarem (uma vez).
  const wanted = typeof router.query.personagem === "string" ? router.query.personagem : null;
  const [handled, setHandled] = useState<string | null>(null);
  if (wanted && !rotations.isLoading && handled !== wanted) {
    setHandled(wanted);
    const a = rotations.agentBySlug(wanted);
    if (a) open(a);
  }

  const agents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return catalog.agents
      .filter((a) => !q || searchNames(a).some((n) => n.toLowerCase().includes(q)))
      .filter((a) => !onlyWithRotations || rotations.rotationsOf(a.id).length > 0);
  }, [catalog.agents, search, onlyWithRotations, rotations]);

  const save = useMutation({
    mutationFn: async () => {
      const parsed = AgentRotationsSchema.safeParse({
        rotations: drafts
          .filter((d) => [d.sequence, d.title, d.description, d.videoUrl, d.videoBax, d.videoBal, d.videoBai].some((v) => v.trim()))
          .map((d) => ({
            uniformId: d.uniformId,
            effect: d.effect,
            title: d.title || null,
            titleEn: d.titleEn || null,
            sequence: d.sequence,
            description: d.description || null,
            descriptionEn: d.descriptionEn || null,
            videoUrl: d.videoUrl || null,
            videoBax: d.videoBax || null,
            videoBal: d.videoBal || null,
            videoBai: d.videoBai || null,
          })),
        scoring,
      });
      if (!parsed.success) throw new ApiError(400, "VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Dados inválidos");
      return adminApi.saveRotations(agent!.id, parsed.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ROTATIONS_KEY });
      // Os modos em que pontua ficam no personagem (catálogo).
      qc.invalidateQueries({ queryKey: ["catalog"] });
      setAgent(null);
      toast.success(messages.saved);
    },
    onError: (e: Error) => setError(e.message),
  });

  const update = (key: string, patch: Partial<RotationDraft>) =>
    setDrafts((ds) => ds.map((d) => (d.key === key ? { ...d, ...patch } : d)));

  return {
    catalog,
    rotationsOf: rotations.rotationsOf,
    isLoading: rotations.isLoading,
    isError: rotations.isError,
    retry: rotations.retry,
    search,
    setSearch,
    onlyWithRotations,
    setOnlyWithRotations,
    agents,
    agent,
    drafts,
    scoring,
    setScoringAuto: (auto: boolean) => setScoring((s) => ({ ...s, auto })),
    toggleScoringMode: (mode: Mode) =>
      setScoring((s) => ({ ...s, modes: sortModes(s.modes.includes(mode) ? s.modes.filter((m) => m !== mode) : [...s.modes, mode]) })),
    /** Modos em que pontua com a escolha atual (os detectados, no automático). */
    scoringModes: agent ? effectiveScoringModes({ ...agent, scoringAuto: scoring.auto, scoringModes: scoring.modes }) : [],
    error,
    isSaving: save.isPending,
    open,
    close: () => setAgent(null),
    add: () => setDrafts((ds) => [...ds, blankDraft(ds.at(-1))]),
    remove: (key: string) => setDrafts((ds) => ds.filter((d) => d.key !== key)),
    move: (key: string, by: -1 | 1) =>
      setDrafts((ds) => {
        const i = ds.findIndex((d) => d.key === key);
        const j = i + by;
        if (i < 0 || j < 0 || j >= ds.length) return ds;
        const copy = [...ds];
        [copy[i], copy[j]] = [copy[j], copy[i]];
        return copy;
      }),
    update,
    submit: () => agent && save.mutate(),
  };
}
