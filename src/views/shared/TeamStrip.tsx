import type { ReactNode } from "react";
import { useTranslation } from "next-i18next/pages";
import { cn } from "@/lib/utils";
import { SLOTS, type Slot } from "@/models/domain/enums";
import type { Ctp } from "@/models/domain/types";
import type { CatalogViewModel } from "@/viewmodels/useCatalogViewModel";
import { MemberChip } from "./MemberChip";

export type TeamTone = "meta" | "alt" | "mine";

/** Uma equipe (Meta, Alternativa ou a do usuário) em 3 colunas compactas: cabe em qualquer largura. */
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
  members: { slot: Slot; uniformId: string; ctpId?: string | null }[];
  catalog: CatalogViewModel;
  /** Indica posse nas equipes Meta/Alternativa (omitir quando o usuário não tem elenco). */
  isOwned?: (uniformId: string) => boolean;
  /** Para a equipe do usuário: CTP equipado no personagem. */
  equippedCtpOf?: (agentId: string) => Ctp | null;
  action?: ReactNode;
}) {
  const { t } = useTranslation("common");
  const isMine = tone === "mine";
  return (
    <div
      className={cn(
        "rounded-md border p-2",
        tone === "meta" && "border-energy/25 bg-energy/5",
        tone === "alt" && "border-border bg-background/40",
        tone === "mine" && "border-brazil-green/30 bg-brazil-green/5",
      )}
    >
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <p
          className={cn(
            "truncate font-heading text-[0.65rem] tracking-[0.2em] uppercase",
            tone === "meta" ? "text-energy" : tone === "mine" ? "text-brazil-green" : "text-muted-foreground",
          )}
        >
          {label}
        </p>
        {action}
      </div>
      <ul className="grid grid-cols-3 gap-1.5">
        {SLOTS.map((slot) => {
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
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
