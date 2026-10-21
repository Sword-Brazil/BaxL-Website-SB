import Link from "next/link";
import { useTranslation } from "next-i18next/pages";
import { CheckIcon, ChevronRightIcon, CrownIcon, SwordIcon, ZapIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ctpColor } from "@/models/domain/ctpColors";
import type { BossEffect } from "@/models/domain/enums";
import type { Ctp } from "@/models/domain/types";
import type { UniformRef } from "@/viewmodels/useCatalogViewModel";
import { BossEffectIcon } from "./BossEffect";
import { CtpBadge } from "./CtpBadge";
import { Hint } from "./Hint";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

/** Moldura da foto pela facção (o clip-path do chanfro corta o `ring`, então a moldura é um fundo). */
const FRAME_BY_SIDE: Record<string, string> = { HERO: "bg-hero/70", VILLAIN: "bg-villain/70" };

/**
 * Striker meta do Causador de Dano: foto redonda no canto superior esquerdo do cartão, com um raio.
 * Sem Striker, o círculo fica tracejado ("Striker a definir").
 */
function StrikerCorner({ striker }: { striker: UniformRef | null }) {
  const { t } = useTranslation("common");
  const uniformLabel = striker && striker.uniform.slug !== "padrao" ? striker.uniform.name : null;
  const label = striker
    ? t("team.striker", { name: `${striker.agent.name}${uniformLabel ? ` — ${uniformLabel}` : ""}` })
    : t("team.noStriker");
  return (
    <Hint label={label}>
      <span aria-label={label} role="img" className="absolute -top-2 -left-2.5 z-10 size-7 sm:size-8">
        {striker ? (
          // Fundo sólido com brilho na cor do Striker: a foto não some sobre o cartão.
          <Avatar
            className={cn(
              "size-full bg-linear-to-b from-spark/40 to-card ring-2 ring-spark shadow-[0_0_10px_-2px_var(--spark)] after:hidden",
              !striker.uniform.active && "grayscale",
            )}
          >
            <AvatarImage src={striker.uniform.portrait || undefined} alt="" loading="lazy" decoding="async" className="object-cover" />
            <AvatarFallback className="bg-secondary font-heading text-[0.5rem] text-secondary-foreground">{initials(striker.agent.name)}</AvatarFallback>
          </Avatar>
        ) : (
          <span className="flex size-full items-center justify-center rounded-full border border-dashed border-spark/60 bg-card text-spark/80 shadow-sm">
            <ZapIcon aria-hidden className="size-3.5" />
          </span>
        )}
        {striker && (
          <span className="absolute -right-1 -bottom-1 flex size-3.5 items-center justify-center rounded-full bg-spark text-background ring-2 ring-card">
            <ZapIcon aria-hidden className="size-2" />
          </span>
        )}
      </span>
    </Hint>
  );
}

/** Selo da posição (Esquerda / Líder / Direita): sempre visível, sobre a borda do cartão. */
function SlotTag({ label, leader, besideStriker }: { label: string; leader?: boolean; besideStriker?: boolean }) {
  return (
    <span
      className={cn(
        "absolute -top-2 left-1/2 flex max-w-[calc(100%-0.5rem)] -translate-x-1/2 items-center gap-0.5 truncate rounded-full border px-1.5 py-px font-heading text-[0.55rem] leading-tight tracking-widest whitespace-nowrap uppercase",
        // Com o Striker na quina esquerda, o selo centraliza no espaço que sobra à direita dele.
        besideStriker && "left-[calc(50%+0.625rem)] max-w-[calc(100%-1.75rem)] tracking-wide",
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
  owned,
  slotLabel,
  leader,
  damageDealer,
  stunEffect,
  striker,
  href,
}: {
  refItem: UniformRef | null;
  ctp: Ctp | null;
  owned?: boolean;
  slotLabel: string;
  /** Líder: fica no meio da equipe, um pouco maior e com brilho. */
  leader?: boolean;
  /** Causador de Dano marcado pelos curadores (selo de espada). */
  damageDealer?: boolean;
  /** O traje causa o efeito da temporada: atordoa o chefe (selo com o ícone do efeito). */
  stunEffect?: BossEffect;
  /** Striker meta do Causador de Dano (apoio da Transcendência 4): ícone no canto do cartão. */
  striker?: UniformRef | null;
  /** Com link (Causador de Dano da Meta): o cartão inteiro leva às rotações do personagem. */
  href?: string;
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
  // Com CTP (o equipado pelo usuário ou o da Meta), o personagem é "pintado" com a cor dele.
  const tinted = !!ctp;

  const label = `${slotLabel}: ${agent.name}${uniformLabel ? ` — ${uniformLabel}` : ""}`;
  const content = (
    <>
      <SlotTag label={slotLabel} leader={leader} besideStriker={damageDealer} />
      {damageDealer && <StrikerCorner striker={striker ?? null} />}
      <div className="relative">
        {/* A dica fica no retrato: o CTP e os selos têm as próprias dicas. */}
        <Hint label={href ? t("team.seeRotationOf", { name: agent.name }) : label}>
          <div
            className={cn("chamfer-sm", tinted ? "p-[3px]" : "p-[2px]", !tinted && (FRAME_BY_SIDE[uniform.side] ?? "bg-border"))}
            style={tinted ? { background: ctpColor(ctp) ?? undefined } : undefined}
          >
            <Avatar className={cn("chamfer-sm rounded-none after:hidden", size, (unavailable || owned === false) && "grayscale")}>
              <AvatarImage src={uniform.portrait || undefined} alt={`${agent.name}${uniformLabel ? ` — ${uniformLabel}` : ""}`} loading="lazy" decoding="async" className="rounded-none" />
              <AvatarFallback className="rounded-none bg-secondary font-heading text-sm text-secondary-foreground">{initials(agent.name)}</AvatarFallback>
            </Avatar>
          </div>
        </Hint>
        {ctp && <CtpBadge ctp={ctp} size={leader ? "lg" : "md"} className="absolute -right-3 -bottom-1" />}
        {damageDealer && (
          <Hint label={t("team.damageDealer")}>
            <span
              className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-spark text-background ring-2 ring-card"
              aria-label={t("team.damageDealer")}
            >
              <SwordIcon className="size-2.5" />
            </span>
          </Hint>
        )}
        {stunEffect && (
          <Hint label={t("season.stuns", { effect: t(`effects.${stunEffect}`) })}>
            <span
              className="absolute -bottom-1 -left-1.5 flex size-5 items-center justify-center rounded-full bg-card ring-2 ring-card"
              aria-label={t("season.stuns", { effect: t(`effects.${stunEffect}`) })}
            >
              <BossEffectIcon effect={stunEffect} className="size-3.5" />
            </span>
          </Hint>
        )}
      </div>
      {/* Posse fica junto do nome: as quinas do cartão e da foto já têm Striker, Causador de Dano e CTP. */}
      <span className={cn("mt-0.5 flex w-full min-w-0 items-center justify-center gap-0.5 leading-tight font-semibold", leader ? "text-xs sm:text-sm" : "text-xs")}>
        {owned && (
          <Hint label={t("team.owned")}>
            <span
              className="flex size-3.5 shrink-0 items-center justify-center rounded-full bg-brazil-green text-background"
              aria-label={t("team.owned")}
            >
              <CheckIcon className="size-2.5" />
            </span>
          </Hint>
        )}
        <span className="min-w-0 truncate">{agent.name}</span>
      </span>
      {/* Sem traje cadastrado a linha fica vazia, para os três cartões manterem a mesma altura. */}
      <span className="w-full truncate text-[0.65rem] leading-tight text-muted-foreground">{uniformLabel ?? "\u00a0"}</span>
      {href && (
        <span className="mt-0.5 flex items-center gap-0.5 font-heading text-[0.6rem] tracking-wider text-spark uppercase">
          {t("team.seeRotation")}
          <ChevronRightIcon className="size-3" />
        </span>
      )}
    </>
  );
  const className = cn(tileClass(leader), owned === false && "opacity-55");
  if (href) {
    return (
      <Link
        href={href}
        aria-label={t("team.seeRotationOf", { name: agent.name })}
        className={cn(
          className,
          "border-spark/50 transition-[transform,border-color] outline-none hover:-translate-y-0.5 hover:border-spark focus-visible:ring-3 focus-visible:ring-spark/50",
        )}
      >
        {content}
      </Link>
    );
  }
  return (
    <div className={className}>
      {content}
    </div>
  );
}
