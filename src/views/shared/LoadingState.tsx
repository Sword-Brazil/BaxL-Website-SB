import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "next-i18next/pages";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";

/** Depois deste tempo carregando, avisa que está demorando (servidor acordando, internet lenta). */
const SLOW_MS = 5000;

/** Fica `true` depois de `ms` com `active` ligado; volta na hora quando desliga. */
export function useDelayedFlag(active: boolean, ms: number) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (!active) return;
    const id = window.setTimeout(() => setOn(true), ms);
    // Ao desligar, zera para a próxima vez também esperar.
    return () => {
      window.clearTimeout(id);
      setOn(false);
    };
  }, [active, ms]);
  return active && on;
}

/**
 * Aviso de carregamento: spinner + "Carregando…" (anunciado a leitores de tela) e, se demorar, uma
 * explicação. Vai acima dos skeletons, ou sozinho em telas que não têm um.
 */
export function LoadingState({ label, className, children }: { label?: string; className?: string; children?: ReactNode }) {
  const { t } = useTranslation("common");
  const slow = useDelayedFlag(true, SLOW_MS);
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div role="status" aria-live="polite" className="flex flex-col gap-0.5 text-sm text-muted-foreground">
        <span className="flex items-center gap-2">
          <Spinner className="text-energy" />
          {label ?? t("states.loading")}
        </span>
        {slow && <span className="pl-6 text-xs motion-safe:animate-in motion-safe:fade-in">{t("states.slow")}</span>}
      </div>
      {children}
    </div>
  );
}
