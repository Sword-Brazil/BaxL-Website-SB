import { Fragment, useState } from "react";
import { useTranslation } from "next-i18next/pages";
import { ChevronDownIcon, ChevronRightIcon, ListOrderedIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CANCELS, ULTIMATE_SKILL, parseRotation, type Cancel, type RotationPart, type RotationStep } from "@/models/rules/rotation";

const CANCEL_CLASS: Record<Cancel, string> = {
  c: "text-spark",
  dc: "text-villain",
  qc: "text-hero",
};

function StepChip({ step }: { step: RotationStep }) {
  const { t } = useTranslation("common");
  const ultimate = step.skill === ULTIMATE_SKILL;
  const label = [
    ultimate ? t("rotation.ultimate") : t("rotation.skill", { n: step.skill }),
    step.cancel ? t(`rotation.cancels.${step.cancel}`) : null,
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <span
      title={label}
      aria-label={label}
      className={cn(
        "inline-flex h-7 min-w-7 items-center justify-center gap-0.5 rounded-md border px-1.5 font-heading text-sm leading-none font-bold tabular-nums",
        ultimate ? "border-energy/60 bg-energy/15 text-energy" : "border-border bg-muted/50",
      )}
    >
      {step.skill}
      {step.cancel && <span className={cn("text-[0.65rem] font-semibold uppercase", CANCEL_CLASS[step.cancel])}>{step.cancel}</span>}
    </span>
  );
}

const Arrow = () => <ChevronRightIcon aria-hidden className="size-3 shrink-0 text-muted-foreground" />;

/** Sequência de habilidades em "chips": 6 (Ultimate) destacado, cancelamentos coloridos, opcionais tracejados. */
export function RotationSequence({ parts, className }: { parts: RotationPart[]; className?: string }) {
  const { t } = useTranslation("common");
  return (
    <ol className={cn("flex flex-wrap items-center gap-1", className)} aria-label={t("rotation.title")}>
      {parts.map((part, i) => (
        <Fragment key={i}>
          {i > 0 && <Arrow />}
          <li className="flex items-center">
            {Array.isArray(part) ? (
              <span
                className="flex items-center gap-1 rounded-lg border border-dashed border-muted-foreground/50 px-1 py-0.5"
                title={t("rotation.optional")}
              >
                <span className="sr-only">{t("rotation.optional")}:</span>
                {part.map((step, j) => (
                  <Fragment key={j}>
                    {j > 0 && <Arrow />}
                    <StepChip step={step} />
                  </Fragment>
                ))}
              </span>
            ) : (
              <StepChip step={part} />
            )}
          </li>
        </Fragment>
      ))}
    </ol>
  );
}

/** Legenda da notação (números, c/dc/qc e parênteses). */
export function RotationLegend({ className }: { className?: string }) {
  const { t } = useTranslation("common");
  return (
    <dl className={cn("grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 text-xs text-muted-foreground", className)}>
      <dt className="font-heading font-bold text-foreground">1–6</dt>
      <dd>{t("rotation.legend.numbers")}</dd>
      {CANCELS.map((c) => (
        <Fragment key={c}>
          <dt className={cn("font-heading font-bold uppercase", CANCEL_CLASS[c])}>{c}</dt>
          <dd>{t(`rotation.legend.${c}`)}</dd>
        </Fragment>
      ))}
      <dt className="font-heading font-bold text-foreground">( )</dt>
      <dd>{t("rotation.legend.optional")}</dd>
    </dl>
  );
}

/** Botão "Rotação" que abre, logo abaixo da equipe, a sequência do Solador e a descrição. */
export function RotationToggle({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const { t } = useTranslation("common");
  return (
    <Button size="xs" variant="ghost" onClick={onToggle} aria-expanded={open} className="text-energy">
      <ListOrderedIcon data-icon="inline-start" />
      {t("rotation.title")}
      <ChevronDownIcon className={cn("transition-transform", open && "rotate-180")} />
    </Button>
  );
}

export function RotationPanel({ rotation, notes }: { rotation: string | null; notes: string | null }) {
  const { t } = useTranslation("common");
  const parsed = rotation ? parseRotation(rotation) : null;
  const [showLegend, setShowLegend] = useState(false);
  return (
    <div className="mt-2 flex flex-col gap-2 rounded-md border border-energy/15 bg-background/60 p-2">
      <p className="font-heading text-[0.65rem] tracking-[0.2em] text-muted-foreground uppercase">{t("rotation.of", { slot: t("team.slots.SOLO") })}</p>
      {parsed?.ok && <RotationSequence parts={parsed.parts} />}
      {notes && <p className="text-xs whitespace-pre-line text-muted-foreground">{notes}</p>}
      {parsed?.ok && (
        <>
          <button
            type="button"
            className="self-start text-[0.7rem] text-energy underline-offset-2 hover:underline"
            onClick={() => setShowLegend((v) => !v)}
            aria-expanded={showLegend}
          >
            {showLegend ? t("rotation.hideLegend") : t("rotation.showLegend")}
          </button>
          {showLegend && <RotationLegend />}
        </>
      )}
    </div>
  );
}
