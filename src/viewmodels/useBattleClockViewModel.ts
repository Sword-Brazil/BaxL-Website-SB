import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getClock } from "@/models/api/clock";
import { getBattleClock } from "@/models/rules/battleClock";

const TICK_MS = 60_000;

/**
 * Relógio da batalha no horário de Brasília. Busca as configurações e o horário do servidor,
 * corrige a diferença para o relógio do aparelho e recalcula a cada minuto: a virada das
 * 12:00 e o reset das 22:00 aparecem sem recarregar a página.
 */
export function useBattleClockViewModel() {
  const query = useQuery({ queryKey: ["clock"], queryFn: getClock, staleTime: 5 * 60_000 });
  const [tick, setTick] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setTick(Date.now()), TICK_MS);
    return () => clearInterval(id);
  }, []);

  const offsetMs = useMemo(
    () => (query.data ? Date.parse(query.data.clock.now) - query.dataUpdatedAt : 0),
    [query.data, query.dataUpdatedAt],
  );

  const clock = useMemo(
    () => (query.data ? getBattleClock(new Date(tick + offsetMs), query.data.settings) : null),
    [query.data, tick, offsetMs],
  );

  return { clock, settings: query.data?.settings ?? null, season: query.data?.season ?? null, isLoading: query.isLoading, isError: query.isError, refetch: query.refetch };
}
