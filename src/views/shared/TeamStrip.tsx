import type { ReactNode } from "react";
import { useTranslation } from "next-i18next/pages";
import { cn } from "@/lib/utils";
import { DISPLAY_SLOTS, type BossEffect, type Slot } from "@/models/domain/enums";
import type { Ctp, MetaTeamMember } from "@/models/domain/types";
import type { CatalogViewModel } from "@/viewmodels/useCatalogViewModel";
import { MemberChip } from "./MemberChip";

export type TeamTone = "meta" | "alt" | "mine";

export type StripMember = { slot: Slot; uniformId: string; ctpId?: string | null } & Partial<
  Pick<MetaTeamMember, "isDamageDealer" | "strikerUniformId">
>;

/** Tela de rotações do personagem, abrindo no traje usado na equipe (e na temporada atual). */
export const rotationHref = (agentSlug: string, uniformSlug: string, effect?: BossEffect) =>
  `/rotacoes/${agentSlug}?traje=${encodeURIComponent(uniformSlug)}${effect ? `&efeito=${effect}` : ""}`;

/**
 * Uma equipe (Meta, Alternativa ou a do usuário) em 3 colunas compactas: Esquerda · Líder · Direita.
 * Na Meta/Alternativa, a foto do Causador de Dano leva à tela de rotações dele.
 */
export function TeamStrip({
  label,
  tone,
  members,
  catalog,
  isOwned,
  equippedCtpOf,
  effect,
  action,
}: {
  label: string;
  tone: TeamTone;
  members: StripMember[];
  catalog: CatalogViewModel;
  /** Indica posse nas equipes Meta/Alternativa (omitir quando o usuário não tem elenco). */
  isOwned?: (uniformId: string) => boolean;
  /** Para a equipe do usuário: CTP padrão do personagem (vale quando o dia não tem CTP próprio). */
  equippedCtpOf?: (agentId: string) => Ctp | null;
  /** Efeito da temporada no modo do dia: marca quem atordoa o chefe. */
  effect?: BossEffect;
  action?: ReactNode;
}) {
  const { t } = useTranslation("common");
  const isMine = tone === "mine";
  return (
    <div
      className={cn(
        "rounded-lg border p-2 sm:p-2.5",
        tone === "meta" && "border-energy/25 bg-energy/5",
        tone === "alt" && "border-border bg-background/40",
        tone === "mine" && "border-brazil-green/30 bg-brazil-green/5",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p
          className={cn(
            "flex min-w-0 items-center gap-1.5 font-heading text-[0.65rem] tracking-[0.2em] uppercase",
            tone === "meta" ? "text-energy" : tone === "mine" ? "text-brazil-green" : "text-muted-foreground",
          )}
        >
          <span aria-hidden className="h-3 w-0.5 shrink-0 rounded-full bg-current" />
          <span className="truncate">{label}</span>
        </p>
        {action && <div className="flex shrink-0 items-center gap-1">{action}</div>}
      </div>
      <ul className="mt-3.5 grid grid-cols-3 items-stretch gap-1.5 sm:gap-2">
        {DISPLAY_SLOTS.map((slot) => {
          const m = members.find((x) => x.slot === slot);
          const ref = m ? catalog.uniformById(m.uniformId) : null;
          // Minha equipe: o CTP deste dia ou, sem ele, o padrão do personagem.
          const ctp = isMine
            ? (catalog.ctpById(m?.ctpId) ?? (ref && equippedCtpOf ? equippedCtpOf(ref.agent.id) : null))
            : catalog.ctpById(m?.ctpId);
          return (
            <li key={slot} className="min-w-0">
              <MemberChip
                refItem={ref}
                ctp={ctp}
                owned={!isMine && isOwned && m ? isOwned(m.uniformId) : undefined}
                slotLabel={t(`team.slots.${slot}`)}
                leader={slot === "SOLO"}
                damageDealer={!isMine && !!m?.isDamageDealer}
                // Meta: Striker do Causador de Dano. Minha equipe: o Striker que o jogador escolheu.
                striker={m?.strikerUniformId && (isMine || m.isDamageDealer) ? catalog.uniformById(m.strikerUniformId) : null}
                stunEffect={effect && ref?.uniform.effects.includes(effect) ? effect : undefined}
                // Causador de Dano da Meta/Alternativa: tocar leva às rotações do personagem.
                href={!isMine && m?.isDamageDealer && ref ? rotationHref(ref.agent.slug, ref.uniform.slug, effect) : undefined}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
