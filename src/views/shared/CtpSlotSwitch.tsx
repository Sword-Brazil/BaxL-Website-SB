import { useTranslation } from "next-i18next/pages";
import { cn } from "@/lib/utils";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { Ctp } from "@/models/domain/types";
import { CTP_SLOTS, type CtpSlot } from "@/models/rules/ctpAssign";
import { CtpBadge } from "./CtpBadge";

/**
 * Qual dos dois CTPs do personagem vale neste dia: "1" (padrão) ou "2" (alternativo). Sem CTP 2, o
 * botão dele fica desligado. `value` null = nenhum (equipe antiga, com CTP só daquele dia).
 */
export function CtpSlotSwitch({
  ctp1,
  ctp2,
  value,
  onChange,
  className,
}: {
  ctp1: Ctp | null;
  ctp2: Ctp | null;
  value: CtpSlot | null;
  onChange: (slot: CtpSlot) => void;
  className?: string;
}) {
  const { t } = useTranslation("common");
  const ctpOf = { 1: ctp1, 2: ctp2 };
  return (
    <ToggleGroup
      type="single"
      size="sm"
      variant="outline"
      value={value ? String(value) : ""}
      onValueChange={(v) => v && onChange(Number(v) as CtpSlot)}
      aria-label={t("ctpSlot.use")}
      className={cn("w-full", className)}
    >
      {CTP_SLOTS.map((slot) => {
        const ctp = ctpOf[slot];
        return (
          <ToggleGroupItem
            key={slot}
            value={String(slot)}
            disabled={slot === 2 && !ctp2}
            aria-label={t("ctpSlot.label", { n: slot })}
            className="h-9 flex-1 gap-1.5 data-[state=on]:border-energy data-[state=on]:bg-energy/15 data-[state=on]:text-energy"
          >
            <span className="font-heading text-xs font-bold tracking-wider">{t("ctpSlot.label", { n: slot })}</span>
            {ctp ? <CtpBadge ctp={ctp} size="xs" /> : <span className="text-xs text-muted-foreground">—</span>}
          </ToggleGroupItem>
        );
      })}
    </ToggleGroup>
  );
}
