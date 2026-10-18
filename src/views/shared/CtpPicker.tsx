import { useState, type ReactNode } from "react";
import { useTranslation } from "next-i18next/pages";
import { CheckIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ctpColor } from "@/models/domain/ctpColors";
import { CTP_TYPES } from "@/models/domain/enums";
import type { Ctp } from "@/models/domain/types";
import { CtpBadge } from "./CtpBadge";

/**
 * Gaveta com todos os CTPs (6 tipos × 3 qualidades) em botões grandes, com rolagem vertical:
 * tocar equipa e fecha. Caminho principal no celular, onde arrastar não é prático.
 */
export function CtpPicker({
  ctps,
  value,
  onChange,
  targetName,
  children,
}: {
  ctps: Ctp[];
  value: string | null;
  onChange: (ctpId: string | null) => void;
  /** Personagem que recebe o CTP (no texto de ajuda). */
  targetName?: string;
  /** Botão que abre a gaveta. */
  children: ReactNode;
}) {
  const { t } = useTranslation("common");
  const [open, setOpen] = useState(false);
  const pick = (ctpId: string | null) => {
    onChange(ctpId);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="bottom" className="max-h-[85dvh] gap-0 rounded-t-2xl">
        <SheetHeader className="pb-2">
          <SheetTitle>{t("ctpPicker.title")}</SheetTitle>
          <SheetDescription className={targetName ? undefined : "sr-only"}>
            {targetName ? t("ctpPicker.hint", { name: targetName }) : t("ctpPicker.title")}
          </SheetDescription>
        </SheetHeader>
        <div className="flex min-h-0 flex-col gap-3 overflow-y-auto overscroll-contain px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {value && (
            <Button variant="outline" size="touch" className="text-destructive" onClick={() => pick(null)}>
              <XIcon data-icon="inline-start" />
              {t("ctpPicker.remove")}
            </Button>
          )}
          {CTP_TYPES.map((type) => {
            const ofType = ctps.filter((c) => c.type === type);
            if (!ofType.length) return null;
            return (
              <section key={type} className="flex flex-col gap-1.5">
                <h3 className="font-heading text-xs tracking-wider text-muted-foreground uppercase">{t(`ctp.${type}`)}</h3>
                <div className="grid grid-cols-3 gap-2">
                  {ofType.map((ctp) => {
                    const selected = ctp.id === value;
                    return (
                      <button
                        key={ctp.id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => pick(ctp.id)}
                        style={{ borderColor: selected ? (ctpColor(ctp) ?? undefined) : undefined }}
                        className={cn(
                          "relative flex min-h-16 flex-col items-center justify-center gap-1 rounded-lg border bg-background/40 p-2 text-xs transition-colors active:scale-[0.97]",
                          selected ? "border-2 bg-energy/10" : "border-border hover:bg-accent/40",
                        )}
                      >
                        <CtpBadge ctp={ctp} size="md" />
                        <span className="leading-tight">{t(`quality.${ctp.quality}`)}</span>
                        {selected && <CheckIcon className="absolute top-1 right-1 size-4 text-energy" />}
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
