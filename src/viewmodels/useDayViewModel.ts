import { useQuery } from "@tanstack/react-query";
import { getBalFree } from "@/models/api/days";

/** Equipes de melhor desempenho do modo livre da BAL. */
export function useBalFreeViewModel() {
  const query = useQuery({ queryKey: ["bal-free"], queryFn: getBalFree });
  return { teams: query.data ?? [], isLoading: query.isLoading, isError: query.isError, retry: query.refetch };
}
