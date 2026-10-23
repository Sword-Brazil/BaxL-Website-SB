import { Fragment, type ComponentType } from "react";
import { useTranslation } from "next-i18next/pages";
import { ChevronRightIcon, CornerDownRightIcon, PlayIcon, RefreshCwIcon, SquareIcon, TriangleAlertIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CANCELS,
  MARKERS,
  ULTIMATE_SKILL,
  isMarker,
  isUnknown,
  parseRotation,
  type Cancel,
  type Marker,
  type RotationPart,
  type RotationStep,
  type RotationUnknown,
} from "@/models/rules/rotation";
import { Hint } from "./Hint";

const CANCEL_CLASS: Record<Cancel, string> = {
  c: "text-spark",
  dc: "text-villain",
  qc: "text-hero",
};

// Ícones pequenos e de traço fino: início ▷, fim ◻, próxima rotação ↳ e recomeço ⟳ (círculo de setas).
const MARKER_ICON: Record<Marker | "start", ComponentType<{ className?: string }>> = {
  start: PlayIcon,
  end: SquareIcon,
  next: CornerDownRightIcon,
  restart: RefreshCwIcon,
};

const MARKER_CLASS: Record<Marker | "start", string> = {
  start: "text-brazil-green",
  end: "text-villain",
  next: "text-spark",
  restart: "text-hero",
};

type Part = RotationPart | RotationUnknown;

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
    <Hint label={label}>
      <span
        aria-label={label}
        className={cn(
          "inline-flex h-7 min-w-7 items-center justify-center gap-0.5 rounded-md border px-1.5 font-heading text-sm leading-none font-bold tabular-nums",
          ultimate ? "border-energy/60 bg-energy/15 text-energy" : "border-border bg-muted/50",
        )}
      >
        {step.skill}
        {step.cancel && <span className={cn("text-[0.65rem] font-semibold uppercase", CANCEL_CLASS[step.cancel])}>{step.cancel}</span>}
      </span>
    </Hint>
  );
}

/** Início (automático), fim, próxima rotação ou recomeço. `n` numera as rotações quando há mais de uma. */
function MarkerChip({ marker, n }: { marker: Marker | "start"; n?: number }) {
  const { t } = useTranslation("common");
  const Icon = MARKER_ICON[marker];
  const label = n ? `${t(`rotation.markers.${marker}`)} ${n}` : t(`rotation.markers.${marker}`);
  return (
    <Hint label={label}>
      <span
        aria-label={label}
        role="img"
        className={cn("inline-flex h-7 items-center justify-center gap-0.5 px-0.5 text-[0.65rem] font-semibold", MARKER_CLASS[marker])}
      >
        <Icon className={cn("size-3", marker === "end" && "size-2.5")} />
        {n && <span className="font-heading tabular-nums">{n}</span>}
      </span>
    </Hint>
  );
}

function UnknownChip({ part }: { part: RotationUnknown }) {
  const { t } = useTranslation("common");
  const label = t("rotation.errors.token", { token: part.unknown });
  return (
    <Hint label={label}>
      <span aria-label={label} className="inline-flex h-7 items-center rounded-md border border-dashed border-destructive/70 bg-destructive/10 px-1.5 text-xs text-destructive line-through">
        {part.unknown}
      </span>
    </Hint>
  );
}

const Arrow = () => <ChevronRightIcon aria-hidden className="size-3 shrink-0 text-muted-foreground" />;

/** Passos, grupos e trechos desconhecidos ganham seta entre si; marcadores, não. */
const isAction = (p: Part | undefined) => !!p && !isMarker(p);

/** Divide nas rotações: cada "/" (próxima rotação) fecha uma e começa a seguinte. */
function splitRotations(parts: Part[]): Part[][] {
  const rotations: Part[][] = [[]];
  for (const p of parts) {
    rotations[rotations.length - 1].push(p);
    if (isMarker(p) && p.marker === MARKERS["/"]) rotations.push([]);
  }
  return rotations.filter((r, i) => r.length || i === 0);
}

/**
 * Sequência de habilidades em "chips": 6 (Ultimate) destacado, cancelamentos coloridos, opcionais
 * tracejados. Cada rotação começa com o ícone de início; "|", "/" e "*" viram os ícones de fim,
 * próxima rotação e recomeço.
 */
export function RotationSequence({ parts, className }: { parts: Part[]; className?: string }) {
  const { t } = useTranslation("common");
  const rotations = splitRotations(parts);
  const numbered = rotations.length > 1;
  return (
    <div className={cn("flex flex-col gap-1.5", className)} aria-label={t("rotation.title")}>
      {rotations.map((rotation, r) => (
        <ol key={r} className="flex flex-wrap items-center gap-1">
          <li className="flex items-center">
            <MarkerChip marker="start" n={numbered ? r + 1 : undefined} />
          </li>
          {rotation.map((part, i) => (
            <Fragment key={i}>
              {isAction(part) && isAction(rotation[i - 1]) && <Arrow />}
              <li className="flex items-center">
                {isMarker(part) ? (
                  <MarkerChip marker={part.marker} />
                ) : isUnknown(part) ? (
                  <UnknownChip part={part} />
                ) : Array.isArray(part) ? (
                  <span className="flex items-center gap-1 rounded-lg border border-dashed border-muted-foreground/50 px-1 py-0.5">
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
      ))}
    </div>
  );
}

/** Legenda da notação (números, c/dc/qc, parênteses e os marcadores). */
export function RotationLegend({ className }: { className?: string }) {
  const { t } = useTranslation("common");
  return (
    <dl className={cn("grid grid-cols-[auto_1fr] items-center gap-x-2 gap-y-1 text-xs text-muted-foreground", className)}>
      <dt className="font-heading font-bold text-foreground">1–7</dt>
      <dd>{t("rotation.legend.numbers")}</dd>
      {CANCELS.map((c) => (
        <Fragment key={c}>
          <dt className={cn("font-heading font-bold uppercase", CANCEL_CLASS[c])}>{c}</dt>
          <dd>{t(`rotation.legend.${c}`)}</dd>
        </Fragment>
      ))}
      <dt className="font-heading font-bold text-foreground">( )</dt>
      <dd>{t("rotation.legend.optional")}</dd>
      <dt>
        <MarkerChip marker="start" />
      </dt>
      <dd>{t("rotation.legend.start")}</dd>
      {Object.entries(MARKERS).map(([char, marker]) => (
        <Fragment key={char}>
          <dt className="flex items-center gap-1">
            <span className="font-heading font-bold text-foreground">{char}</span>
            <MarkerChip marker={marker} />
          </dt>
          <dd>{t(`rotation.legend.${marker}`)}</dd>
        </Fragment>
      ))}
    </dl>
  );
}

/**
 * Sequência em texto livre: se seguir a notação da comunidade (1–7, c/dc/qc, parênteses e |, /, *),
 * vira "chips"; senão aparece como foi escrita. Na prévia (`preview`), um texto com erro mostra os
 * chips até onde deu para ler e o aviso do que não foi entendido.
 */
export function RotationText({ text, className, preview = false }: { text: string; className?: string; preview?: boolean }) {
  const { t } = useTranslation("common");
  const parsed = parseRotation(text);
  if (parsed.ok) return <RotationSequence parts={parsed.parts} className={className} />;
  if (!preview) return <p className={cn("text-sm font-medium whitespace-pre-wrap", className)}>{text}</p>;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {parsed.parts.length > 0 && <RotationSequence parts={parsed.parts} />}
      <p role="status" className="flex items-start gap-1.5 text-xs text-antihero">
        <TriangleAlertIcon className="mt-px size-3.5 shrink-0" />
        {t(`rotation.errors.${parsed.error}`, { token: parsed.token ?? "" })}
      </p>
    </div>
  );
}
