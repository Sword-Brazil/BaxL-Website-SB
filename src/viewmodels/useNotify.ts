import { useCallback } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import type { TFunction } from "i18next";
import { useTranslation } from "next-i18next/pages";
import { toast } from "sonner";
import { channelsOf, type SecurityEventType } from "@/models/domain/securityEvents";

export const NOTICES_KEY = ["notices"] as const;

/**
 * Ponto único das notificações de segurança no cliente (FN-001): o canal vem do catálogo.
 * Informativo → toast; atenção/crítico já foram gravados pelo servidor → recarrega os avisos.
 */
export function notifyClient(qc: QueryClient, t: TFunction, type: SecurityEventType) {
  const channels = channelsOf(type);
  if (channels.includes("toast")) toast.info(t(`common:security.toast.${type}`));
  if (channels.includes("banner")) qc.invalidateQueries({ queryKey: NOTICES_KEY });
}

export function useNotify() {
  const qc = useQueryClient();
  const { t } = useTranslation("common");
  return useCallback((type: SecurityEventType) => notifyClient(qc, t, type), [qc, t]);
}
