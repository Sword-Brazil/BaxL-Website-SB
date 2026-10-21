import { Fragment } from "react";
import { useTranslation } from "next-i18next/pages";
import { ChevronRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";
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

/**
 * Sequência em texto livre: se seguir a notação da comunidade (1–6, c/dc/qc, parênteses), vira
 * "chips"; senão aparece como foi escrita.
 */
export function RotationText({ text, className }: { text: string; className?: string }) {
  const parsed = parseRotation(text);
  return parsed.ok ? (
    <RotationSequence parts={parsed.parts} className={className} />
  ) : (
    <p className={cn("text-sm font-medium whitespace-pre-wrap", className)}>{text}</p>
  );
}
