import { useTranslation } from "next-i18next/pages";
import { CheckIcon, CrownIcon, SwordIcon } from "lucide-react";
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

/** Moldura da foto pela facção (o clip-path do chanfro corta o `ring`, então a moldura é um fundo). */
const FRAME_BY_SIDE: Record<string, string> = { HERO: "bg-hero/70", VILLAIN: "bg-villain/70" };

/** Selo da posição (Esquerda / Líder / Direita): sempre visível, sobre a borda do cartão. */
function SlotTag({ label, leader }: { label: string; leader?: boolean }) {
  return (
    <span
      className={cn(
        "absolute -top-2 left-1/2 flex max-w-[calc(100%-0.5rem)] -translate-x-1/2 items-center gap-0.5 truncate rounded-full border px-1.5 py-px font-heading text-[0.55rem] leading-tight tracking-widest whitespace-nowrap uppercase",
        leader ? "border-energy bg-energy text-primary-foreground" : "border-border bg-card text-muted-foreground",
      )}
    >
      {leader && <CrownIcon aria-hidden className="size-2.5 shrink-0" />}
      {label}
    </span>
  );
}

const tileClass = (leader?: boolean) =>
  cn(
    "relative flex h-full min-w-0 flex-col items-center gap-1 rounded-lg border px-1 pt-4 pb-1.5 text-center",
    leader ? "energy-glow border-energy/50 bg-linear-to-b from-energy/15 to-transparent" : "border-border/70 bg-linear-to-b from-muted/40 to-transparent",
  );

/**
 * Membro de equipe em formato de cartão (posição, foto com moldura, nome, traje e CTP sobreposto).
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
  const size = leader ? "size-14 sm:size-16" : "size-12 sm:size-14";
  if (!refItem) {
    return (
      <div className={cn(tileClass(leader), "opacity-60")}>
        <SlotTag label={slotLabel} leader={leader} />
        <div className={cn("chamfer-sm flex items-center justify-center border border-dashed bg-secondary text-muted-foreground", size)}>?</div>
        <span className="w-full truncate text-[0.65rem] text-muted-foreground">{t("team.emptySlot")}</span>
      </div>
    );
  }
  const { agent, uniform } = refItem;
  const unavailable = !agent.active || !uniform.active;
  const uniformLabel = uniform.slug === "padrao" ? null : uniform.name;
  // Personagem do usuário "pintado" com a cor do CTP equipado.
  const tinted = !!ctp && !ctpTypeOnly;

  return (
    <div
      className={cn(tileClass(leader), owned === false && "opacity-55")}
      title={`${slotLabel}: ${agent.name}${uniformLabel ? ` — ${uniformLabel}` : ""}`}
    >
      <SlotTag label={slotLabel} leader={leader} />
      <div className="relative">
        <div
          className={cn("chamfer-sm", tinted ? "p-[3px]" : "p-[2px]", !tinted && (FRAME_BY_SIDE[uniform.side] ?? "bg-border"))}
          style={tinted ? { background: ctpColor(ctp) ?? undefined } : undefined}
        >
          <Avatar className={cn("chamfer-sm rounded-none after:hidden", size, (unavailable || owned === false) && "grayscale")}>
            <AvatarImage src={uniform.portrait || undefined} alt={`${agent.name}${uniformLabel ? ` — ${uniformLabel}` : ""}`} loading="lazy" decoding="async" className="rounded-none" />
            <AvatarFallback className="rounded-none bg-secondary font-heading text-sm text-secondary-foreground">{initials(agent.name)}</AvatarFallback>
          </Avatar>
        </div>
        {ctp && <CtpBadge ctp={ctp} typeOnly={ctpTypeOnly} size="xs" className="absolute -right-1.5 -bottom-1.5" />}
        {damageDealer && (
          <span
            className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-spark text-background ring-2 ring-card"
            title={t("team.damageDealer")}
            aria-label={t("team.damageDealer")}
          >
            <SwordIcon className="size-2.5" />
          </span>
        )}
        {owned && (
          <span
            className="absolute -top-1.5 -left-1.5 flex size-4 items-center justify-center rounded-full bg-brazil-green text-background ring-2 ring-card"
            aria-label={t("team.owned")}
          >
            <CheckIcon className="size-3" />
          </span>
        )}
      </div>
      <span className={cn("mt-0.5 w-full truncate leading-tight font-semibold", leader ? "text-xs sm:text-sm" : "text-xs")}>{agent.name}</span>
      {/* Sem traje cadastrado a linha fica vazia, para os três cartões manterem a mesma altura. */}
      <span className="w-full truncate text-[0.65rem] leading-tight text-muted-foreground">{uniformLabel ?? "\u00a0"}</span>
    </div>
  );
}
