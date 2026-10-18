import { useDraggable } from "@dnd-kit/core";
import { useTranslation } from "next-i18next/pages";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CTP_TYPES } from "@/models/domain/enums";
import type { Ctp } from "@/models/domain/types";
import { CtpBadge } from "@/views/shared/CtpBadge";

function PaletteItem({ ctp, armed, onArm, idPrefix }: { ctp: Ctp; armed: boolean; onArm: (id: string) => void; idPrefix: string }) {
  const { t } = useTranslation("common");
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({ id: `${idPrefix}:${ctp.id}`, data: { ctpId: ctp.id } });
  const label = `${t(`ctp.${ctp.type}`)} · ${t(`quality.${ctp.quality}`)}`;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          ref={setNodeRef}
          {...listeners}
          {...attributes}
          type="button"
          variant="outline"
          size="icon-touch"
          aria-pressed={armed}
          aria-label={label}
          onClick={() => onArm(ctp.id)}
          className={cn(
            "cursor-grab touch-none active:cursor-grabbing",
            armed && "border-energy bg-energy/15 ring-2 ring-energy/60",
            isDragging && "opacity-40",
          )}
        >
          <CtpBadge ctp={ctp} size="md" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

/**
 * Paleta de CTPs PVE (6 tipos × 3 qualidades) só com ícones, para caber em qualquer largura:
 * arrastar até um personagem, ou tocar para "armar" e depois tocar no personagem. Usada no PC;
 * no celular, cada personagem abre o CtpPicker.
 */
export function CtpPalette({
  ctps,
  armedCtp,
  onArm,
  idPrefix,
  className,
}: {
  ctps: Ctp[];
  armedCtp: string | null;
  onArm: (ctpId: string) => void;
  /** Prefixo dos ids de arraste: a paleta pode aparecer em dois lugares ao mesmo tempo. */
  idPrefix: string;
  className?: string;
}) {
  const { t } = useTranslation("common");
  const group = (type: (typeof CTP_TYPES)[number]) =>
    ctps
      .filter((c) => c.type === type)
      .map((ctp) => <PaletteItem key={ctp.id} ctp={ctp} armed={armedCtp === ctp.id} onArm={onArm} idPrefix={idPrefix} />);

  return (
    <div className={cn("grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1.5", className)}>
      {CTP_TYPES.map((type) => (
        <div key={type} className="contents">
          <span className="truncate font-heading text-xs tracking-wider text-muted-foreground uppercase">{t(`ctp.${type}`)}</span>
          <div className="flex gap-1">{group(type)}</div>
        </div>
      ))}
    </div>
  );
}
