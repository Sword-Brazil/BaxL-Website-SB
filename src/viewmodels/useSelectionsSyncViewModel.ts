import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getRemoteSelections, putRemoteSelections } from "@/models/api/auth";
import { ApiError } from "@/models/api/client";
import { mergeDecision } from "@/models/rules/selectionsSync";
import type { UserSelections } from "@/models/schemas/selections";
import { useSelectionsStore } from "./stores/selectionsStore";
import { useAuthViewModel } from "./useAuthViewModel";
import { useNotify } from "./useNotify";

const DEBOUNCE_MS = 2000;

/**
 * Sincroniza as seleções do aparelho com a conta (opcional):
 * - ao entrar: envia o local se a conta estiver vazia, usa o da conta se o local estiver vazio,
 *   e pergunta ao usuário quando os dois lados têm conteúdos diferentes;
 * - logado: envia as mudanças com debounce de 2 s; conflito (409) volta a perguntar.
 * Nada é descartado sem confirmação.
 */
export function useSelectionsSyncViewModel() {
  const { user } = useAuthViewModel();
  const qc = useQueryClient();
  const notify = useNotify();
  const { doc, hydrated, syncUserId, syncBase, syncedLocalAt, replaceAll, markSynced } = useSelectionsStore();
  const [conflict, setConflict] = useState<UserSelections | null>(null);
  const checkedFor = useRef<string | null>(null);

  // Ao entrar (uma vez por carregamento de página e conta).
  useEffect(() => {
    if (!hydrated || !user || checkedFor.current === user.id) return;
    checkedFor.current = user.id;
    (async () => {
      const remote = await getRemoteSelections().catch(() => undefined);
      // Saiu da conta enquanto a checagem estava em andamento: não religa o aparelho.
      if (remote === undefined || qc.getQueryData<{ id: string } | null>(["me"])?.id !== user.id) return;
      const state = useSelectionsStore.getState();
      const linked = state.syncUserId === user.id;
      const localDirty = state.doc.updatedAt !== state.syncedLocalAt;

      if (linked && remote && remote.updatedAt !== state.syncBase && !localDirty) {
        replaceAll(remote);
        markSynced(remote.updatedAt, user.id);
        notify("SELECTIONS_SYNCED");
        return;
      }
      if (linked && (!remote || remote.updatedAt === state.syncBase)) return;

      switch (mergeDecision(state.doc, remote)) {
        case "UPLOAD_LOCAL": {
          const saved = await putRemoteSelections(state.doc, remote?.updatedAt ?? null);
          markSynced(saved.updatedAt, user.id);
          notify("SELECTIONS_SYNCED");
          break;
        }
        case "USE_REMOTE":
          replaceAll(remote!);
          markSynced(remote!.updatedAt, user.id);
          notify("SELECTIONS_SYNCED");
          break;
        case "IN_SYNC":
          markSynced(remote?.updatedAt ?? null, user.id);
          break;
        case "ASK_USER":
          setConflict(remote);
          break;
      }
    })();
  }, [hydrated, user, replaceAll, markSynced, notify, qc]);

  // Envio das mudanças locais (debounce).
  const dirty = doc.updatedAt !== syncedLocalAt;
  useEffect(() => {
    if (!user || syncUserId !== user.id || !dirty || conflict) return;
    const id = setTimeout(async () => {
      try {
        const saved = await putRemoteSelections(useSelectionsStore.getState().doc, syncBase);
        markSynced(saved.updatedAt, user.id);
      } catch (e) {
        if (e instanceof ApiError && e.status === 409) {
          const remote = await getRemoteSelections().catch(() => null);
          if (remote) setConflict(remote);
        } else if (e instanceof ApiError && e.status === 401) {
          qc.setQueryData(["me"], null);
          notify("SESSION_EXPIRED");
        }
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [user, syncUserId, syncBase, dirty, doc, conflict, markSynced, qc, notify]);

  return {
    conflict: !!conflict,
    /** Mantém o que está no aparelho e sobrescreve a conta. */
    keepLocal: async () => {
      if (!user || !conflict) return;
      const saved = await putRemoteSelections(useSelectionsStore.getState().doc, conflict.updatedAt);
      markSynced(saved.updatedAt, user.id);
      setConflict(null);
      notify("SELECTIONS_SYNCED");
    },
    /** Usa o que está na conta e substitui o aparelho. */
    keepRemote: () => {
      if (!user || !conflict) return;
      replaceAll(conflict);
      markSynced(conflict.updatedAt, user.id);
      setConflict(null);
      notify("SELECTIONS_SYNCED");
    },
  };
}
