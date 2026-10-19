import { Fragment, useState } from "react";
import { useTranslation } from "next-i18next/pages";
import { ChevronDownIcon, ChevronRightIcon, ExternalLinkIcon, ListOrderedIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CANCELS, ULTIMATE_SKILL, parseRotation, type Cancel, type RotationPart, type RotationStep } from "@/models/rules/rotation";
import { parseRotationVideo, youtubeEmbedUrl } from "@/models/rules/rotationVideo";

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

/**
 * Vídeo de referência em loop, mudo. Só é montado quando o painel de rotação abre, então não
 * pesa na tela; o vídeo vem do YouTube (sem cookies) ou de um arquivo hospedado fora.
 */
export function RotationVideoPlayer({ url, title }: { url: string; title: string }) {
  const { t } = useTranslation("common");
  const video = parseRotationVideo(url);
  if (!video) return null;
  return (
    <div className="flex max-w-sm flex-col gap-1">
      <div className="overflow-hidden rounded-md border border-energy/20 bg-black">
        {video.kind === "youtube" ? (
          <iframe
            src={youtubeEmbedUrl(video)}
            title={title}
            loading="lazy"
            allow="autoplay; encrypted-media; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
            className="aspect-video w-full"
          />
        ) : (
          <video src={video.url} autoPlay muted loop playsInline preload="metadata" aria-label={title} className="aspect-video w-full" />
        )}
      </div>
      <a href={url} target="_blank" rel="noreferrer noopener" className="flex items-center gap-1 self-start text-[0.7rem] text-energy hover:underline">
        <ExternalLinkIcon className="size-3" />
        {t("rotation.openVideo")}
      </a>
    </div>
  );
}

/** Rotação de cada Causador de Dano da equipe (sequência e descrição) e a legenda da notação. */
export function RotationPanel({
  rotations,
}: {
  rotations: { slot: string; name: string; rotation: string | null; notes: string | null; videoUrl: string | null }[];
}) {
  const { t } = useTranslation("common");
  const [showLegend, setShowLegend] = useState(false);
  return (
    <div className="mt-2 flex flex-col gap-3 rounded-md border border-energy/15 bg-background/60 p-2">
      {rotations.map((r) => {
        const parsed = r.rotation ? parseRotation(r.rotation) : null;
        return (
          <div key={r.slot} className="flex flex-col gap-1.5">
            <p className="font-heading text-[0.65rem] tracking-[0.2em] text-muted-foreground uppercase">
              {t("rotation.of", { name: r.name })}
            </p>
            {parsed?.ok && <RotationSequence parts={parsed.parts} />}
            {r.notes && <p className="text-xs whitespace-pre-line text-muted-foreground">{r.notes}</p>}
            {r.videoUrl && <RotationVideoPlayer url={r.videoUrl} title={t("rotation.of", { name: r.name })} />}
          </div>
        );
      })}
      <button
        type="button"
        className="self-start text-[0.7rem] text-energy underline-offset-2 hover:underline"
        onClick={() => setShowLegend((v) => !v)}
        aria-expanded={showLegend}
      >
        {showLegend ? t("rotation.hideLegend") : t("rotation.showLegend")}
      </button>
      {showLegend && <RotationLegend />}
    </div>
  );
}
