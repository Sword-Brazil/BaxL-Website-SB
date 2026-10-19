import type * as React from "react";
import { useTranslation } from "next-i18next/pages";
import { CheckIcon, SwordIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ctpColor } from "@/models/domain/ctpColors";
import type { Ctp } from "@/models/domain/types";
import type { UniformRef } from "@/viewmodels/useCatalogViewModel";
import { CtpBadge } from "./CtpBadge";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

/**
 * Membro de equipe em formato compacto (retrato, nome, traje e CTP sobreposto).
 * Cabe em 3 colunas até em telas de 360px. `owned`: undefined = não indicar posse.
 */
export function MemberChip({
  refItem,
  ctp,
  ctpTypeOnly,
  owned,
  slotLabel,
  leader,
  damageDealer,
}: {
  refItem: UniformRef | null;
  ctp: Ctp | null;
  ctpTypeOnly?: boolean;
  owned?: boolean;
  slotLabel: string;
  /** Líder: fica no meio da equipe, um pouco maior e com brilho. */
  leader?: boolean;
  /** Causador de Dano marcado pelos curadores (selo de espada). */
  damageDealer?: boolean;
}) {
  const { t } = useTranslation("common");
  if (!refItem) {
    return (
      <div className="flex min-w-0 flex-col items-center gap-1 text-center opacity-60">
        <div
          className={cn(
            "chamfer-sm flex items-center justify-center bg-secondary text-muted-foreground",
            leader ? "size-14 sm:size-16" : "size-12 sm:size-14",
          )}
        >
          ?
        </div>
        <span className={cn("w-full truncate text-[0.65rem]", leader ? "text-energy" : "text-muted-foreground")}>{slotLabel}</span>
      </div>
    );
  }
  const { agent, uniform } = refItem;
  const unavailable = !agent.active || !uniform.active;
  const sideRing = agent.side === "HERO" ? "ring-hero/70" : agent.side === "VILLAIN" ? "ring-villain/70" : "ring-border";
  const uniformLabel = uniform.slug === "padrao" ? null : uniform.name;

  return (
    <div
      className={cn("flex min-w-0 flex-col items-center gap-1 text-center", owned === false && "opacity-55")}
      title={`${slotLabel}: ${agent.name}${uniformLabel ? ` — ${uniformLabel}` : ""}`}
    >
      <div className="relative">
        <Avatar
          className={cn(
            "chamfer-sm rounded-none ring-2 after:hidden",
            leader ? "size-14 shadow-[0_0_14px_-2px_var(--glow)] sm:size-16" : "size-12 sm:size-14",
            sideRing,
            ctp && !ctpTypeOnly && "ring-[3px]",
            (unavailable || owned === false) && "grayscale",
          )}
          // Personagem do usuário "pintado" com a cor do CTP equipado.
          style={ctp && !ctpTypeOnly ? ({ "--tw-ring-color": ctpColor(ctp) } as React.CSSProperties) : undefined}
        >
          <AvatarImage src={uniform.portrait || undefined} alt={`${agent.name}${uniformLabel ? ` — ${uniformLabel}` : ""}`} loading="lazy" decoding="async" className="rounded-none" />
          <AvatarFallback className="rounded-none bg-secondary font-heading text-sm text-secondary-foreground">{initials(agent.name)}</AvatarFallback>
        </Avatar>
        {ctp && <CtpBadge ctp={ctp} typeOnly={ctpTypeOnly} size="xs" className="absolute -right-1.5 -bottom-1.5" />}
        {damageDealer && (
          <span
            className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-spark text-background"
            title={t("team.damageDealer")}
            aria-label={t("team.damageDealer")}
          >
            <SwordIcon className="size-2.5" />
          </span>
        )}
        {owned && (
          <span className="absolute -top-1.5 -left-1.5 flex size-4 items-center justify-center rounded-full bg-brazil-green text-background" aria-label={t("team.owned")}>
            <CheckIcon className="size-3" />
          </span>
        )}
      </div>
      <span className={cn("w-full truncate leading-tight font-medium", leader ? "text-sm" : "text-xs")}>{agent.name}</span>
      <span className="w-full truncate text-[0.65rem] leading-tight text-muted-foreground">{uniformLabel ?? slotLabel}</span>
    </div>
  );
}
