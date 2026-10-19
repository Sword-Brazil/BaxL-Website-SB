import { useState, type ReactNode } from "react";
import { useTranslation } from "next-i18next/pages";
import { cn } from "@/lib/utils";
import { DISPLAY_SLOTS, type Slot } from "@/models/domain/enums";
import type { Ctp, MetaTeamMember } from "@/models/domain/types";
import type { CatalogViewModel } from "@/viewmodels/useCatalogViewModel";
import { MemberChip } from "./MemberChip";
import { RotationPanel, RotationToggle } from "./RotationSequence";

export type TeamTone = "meta" | "alt" | "mine";

export type StripMember = { slot: Slot; uniformId: string; ctpId?: string | null } & Partial<
  Pick<MetaTeamMember, "isDamageDealer" | "rotation" | "rotationNotes">
>;

/**
 * Uma equipe (Meta, Alternativa ou a do usuário) em 3 colunas compactas: Esquerda · Líder · Direita.
 * Equipes curadas com Causador de Dano que tem rotação ganham o botão "Rotação".
 */
export function TeamStrip({
  label,
  tone,
  members,
  catalog,
  isOwned,
  equippedCtpOf,
  action,
}: {
  label: string;
  tone: TeamTone;
  members: StripMember[];
  catalog: CatalogViewModel;
  /** Indica posse nas equipes Meta/Alternativa (omitir quando o usuário não tem elenco). */
  isOwned?: (uniformId: string) => boolean;
  /** Para a equipe do usuário: CTP equipado no personagem. */
  equippedCtpOf?: (agentId: string) => Ctp | null;
  action?: ReactNode;
}) {
  const { t } = useTranslation("common");
  const isMine = tone === "mine";
  const [showRotation, setShowRotation] = useState(false);
  const rotations = DISPLAY_SLOTS.flatMap((slot) => {
    const m = members.find((x) => x.slot === slot);
    if (!m?.isDamageDealer || !(m.rotation || m.rotationNotes)) return [];
    const name = catalog.uniformById(m.uniformId)?.agent.name ?? t(`team.slots.${slot}`);
    return [{ slot, name, rotation: m.rotation ?? null, notes: m.rotationNotes ?? null }];
  });
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
        {(rotations.length > 0 || action) && (
          <div className="flex shrink-0 items-center gap-1">
            {rotations.length > 0 && <RotationToggle open={showRotation} onToggle={() => setShowRotation((v) => !v)} />}
            {action}
          </div>
        )}
      </div>
      <ul className="mt-3.5 grid grid-cols-3 items-stretch gap-1.5 sm:gap-2">
        {DISPLAY_SLOTS.map((slot) => {
          const m = members.find((x) => x.slot === slot);
          const ref = m ? catalog.uniformById(m.uniformId) : null;
          const ctp = isMine ? (ref && equippedCtpOf ? equippedCtpOf(ref.agent.id) : null) : catalog.ctpById(m?.ctpId);
          return (
            <li key={slot} className="min-w-0">
              <MemberChip
                refItem={ref}
                ctp={ctp}
                ctpTypeOnly={!isMine}
                owned={!isMine && isOwned && m ? isOwned(m.uniformId) : undefined}
                slotLabel={t(`team.slots.${slot}`)}
                leader={slot === "SOLO"}
                damageDealer={!isMine && !!m?.isDamageDealer}
              />
            </li>
          );
        })}
      </ul>
      {rotations.length > 0 && showRotation && <RotationPanel rotations={rotations} />}
    </div>
  );
}
