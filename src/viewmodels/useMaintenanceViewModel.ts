import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getHealth } from "@/models/api/health";
import { useCriticalErrorStore } from "./stores/criticalErrorStore";

/** De quanto em quanto tempo a tela de manutenção confere se o site voltou. */
export const MAINTENANCE_POLL_MS = 30_000;

/**
 * Tela de manutenção: confere o banco a cada 30 s (e no "Tentar agora"). Quando volta, sai da tela
 * e recarrega todos os dados, sem a pessoa precisar atualizar a página.
 */
export function useMaintenanceViewModel() {
  const qc = useQueryClient();
  const clear = useCriticalErrorStore((s) => s.clear);
  const [checking, setChecking] = useState(false);

  const check = useCallback(async () => {
    setChecking(true);
    try {
      await getHealth();
      clear();
      await qc.invalidateQueries();
    } catch {
      /* continua em manutenção */
    } finally {
      setChecking(false);
    }
  }, [clear, qc]);

  useEffect(() => {
    const id = window.setInterval(check, MAINTENANCE_POLL_MS);
    return () => window.clearInterval(id);
  }, [check]);

  return { checking, check };
}
