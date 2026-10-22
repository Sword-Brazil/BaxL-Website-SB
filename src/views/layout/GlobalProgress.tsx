import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useIsFetching, useIsMutating } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useDelayedFlag } from "@/views/shared/LoadingState";

/**
 * Barra fina no topo enquanto a página troca ou o app espera o servidor (consultas e ações).
 * Só aparece depois de um instante, para não piscar em respostas rápidas.
 */
export function GlobalProgress() {
  const router = useRouter();
  const [routing, setRouting] = useState(false);
  const fetching = useIsFetching();
  const mutating = useIsMutating();

  useEffect(() => {
    const start = (_url: string, { shallow }: { shallow: boolean }) => !shallow && setRouting(true);
    const stop = () => setRouting(false);
    router.events.on("routeChangeStart", start);
    router.events.on("routeChangeComplete", stop);
    router.events.on("routeChangeError", stop);
    return () => {
      router.events.off("routeChangeStart", start);
      router.events.off("routeChangeComplete", stop);
      router.events.off("routeChangeError", stop);
    };
  }, [router.events]);

  const visible = useDelayedFlag(routing || fetching + mutating > 0, 150);
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5 overflow-hidden transition-opacity duration-300",
        visible ? "opacity-100" : "opacity-0",
      )}
    >
      <div className="h-full w-1/3 bg-energy shadow-[0_0_8px_var(--glow)] motion-safe:animate-[progress-slide_1.1s_ease-in-out_infinite] motion-reduce:w-full motion-reduce:opacity-70" />
    </div>
  );
}
