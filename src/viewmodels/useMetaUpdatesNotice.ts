import { useEffect, useRef, useState } from "react";
import { useTranslation } from "next-i18next/pages";
import { toast } from "sonner";
import type { CycleOverview } from "@/models/domain/types";
import { changedMetaDays } from "@/models/rules/metaUpdates";

const SEEN_KEY = "mff:metas-seen-at";
/** Início da comparação desta sessão: recarregar a página mantém os selos e não repete o toast. */
const SESSION_KEY = "mff:metas-since";
const MAX_LISTED = 4;

/**
 * Metas alteradas desde a última visita deste aparelho: avisa por toast (uma vez por sessão) e
 * devolve os dias alterados ("BAX 5", "BAL 12", "BAI") para os selos "Meta atualizada".
 * Na primeira visita só registra o momento (não há o que comparar).
 */
export function useMetaUpdatesNotice(cycle: CycleOverview | undefined): ReadonlySet<string> {
  const { t } = useTranslation("common");
  const done = useRef(false);
  const [updated, setUpdated] = useState<ReadonlySet<string>>(new Set());

  useEffect(() => {
    if (!cycle || done.current) return;
    done.current = true;
    let since: string | null;
    let isNewSession: boolean;
    try {
      const session = sessionStorage.getItem(SESSION_KEY);
      isNewSession = !session;
      since = session ?? localStorage.getItem(SEEN_KEY);
      if (isNewSession) {
        if (since) sessionStorage.setItem(SESSION_KEY, since);
        localStorage.setItem(SEEN_KEY, new Date().toISOString());
      }
    } catch {
      return; // armazenamento bloqueado: sem histórico, sem aviso
    }
    if (!since) return;
    const days = changedMetaDays(cycle, since);
    // Atualiza depois de ler o ciclo (dado externo, carregado de forma assíncrona).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUpdated(new Set(days));
    if (!days.length || !isNewSession) return;
    const extra = days.length - MAX_LISTED;
    const list = days.slice(0, MAX_LISTED).join(", ") + (extra > 0 ? ` ${t("metaUpdates.more", { n: extra })}` : "");
    toast.info(t("metaUpdates.title"), { description: t("metaUpdates.text", { list }), duration: 8000 });
  }, [cycle, t]);

  return updated;
}
