import type * as React from "react";
import { useTranslation } from "next-i18next/pages";
import { cn } from "@/lib/utils";
import { SEASON_EFFECTS, SEASONS, type BossEffect, type SeasonId } from "@/models/domain/enums";

/** Cor de cada efeito: a mesma no ícone, no selo da temporada e no traje que atordoa o chefe. */
export const BOSS_EFFECT_COLORS: Record<BossEffect, string> = {
  SILENCE: "#a78bfa",
  PARALYSIS: "#a3e635",
  BURN: "#f97316",
  FRACTURE: "#f43f5e",
  SHOCK: "#38bdf8",
  TRAP: "#d6a35c",
};

/** Traços de cada ícone (viewBox 24, linha de 2px, na cor atual). */
const PATHS: Record<BossEffect, React.ReactNode> = {
  // Balão de fala cortado.
  SILENCE: (
    <>
      <path d="M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-7l-4 3.5V17H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
      <path d="m4 3 17 18" />
    </>
  ),
  // Mão de "pare": imobilizado.
  PARALYSIS: (
    <>
      <path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11" />
      <path d="M11 10V4a1.5 1.5 0 0 1 3 0v6" />
      <path d="M14 10.5V6a1.5 1.5 0 0 1 3 0v8" />
      <path d="M8 11.5a1.5 1.5 0 0 0-3 0v1.5a8 8 0 0 0 8 8h1a5 5 0 0 0 5-5v-2" />
    </>
  ),
  // Chama.
  BURN: <path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2.2 1-3.6 2.2-4.8.2 1.6.9 2.6 1.9 3.2C11 9 11.4 6 12 3Z" />,
  // Escudo rachado.
  FRACTURE: (
    <>
      <path d="M12 3 4.5 6v5.5c0 4.5 3.2 8 7.5 9.5 4.3-1.5 7.5-5 7.5-9.5V6L12 3Z" />
      <path d="m12.5 6-2 4 3 2-2.5 3 1 3" />
    </>
  ),
  // Raio.
  SHOCK: <path d="M13.5 2 5 13.5h6L10 22l9-12h-6.2L13.5 2Z" />,
  // Armadilha de dentes.
  TRAP: (
    <>
      <path d="M3 14a9 9 0 0 1 18 0" />
      <path d="m6 14 1.5-3L9 14l1.5-4L12 14l1.5-4L15 14l1.5-3L18 14" />
      <path d="M2 14h20M12 14v6m-4 0h8" />
    </>
  ),
};

export function BossEffectIcon({ effect, className, colored = true }: { effect: BossEffect; className?: string; colored?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={cn("size-4 shrink-0", className)}
      style={colored ? { color: BOSS_EFFECT_COLORS[effect] } : undefined}
    >
      {PATHS[effect]}
    </svg>
  );
}

/** Fundo e borda tingidos pela cor do efeito (para selos e botões). */
export const bossEffectTint = (effect: BossEffect): React.CSSProperties => ({
  borderColor: `color-mix(in oklch, ${BOSS_EFFECT_COLORS[effect]} 55%, transparent)`,
  backgroundColor: `color-mix(in oklch, ${BOSS_EFFECT_COLORS[effect]} 14%, transparent)`,
});

/** Selo de um efeito: ícone + nome. `season` = efeito da temporada atual (atordoa o chefe). */
export function BossEffectBadge({ effect, season, className }: { effect: BossEffect; season?: boolean; className?: string }) {
  const { t } = useTranslation("common");
  const name = t(`effects.${effect}`);
  return (
    <span
      title={season ? t("season.stunHint", { effect: name }) : name}
      className={cn(
        "inline-flex h-6 shrink-0 items-center gap-1 rounded-full border px-2 pl-1 font-heading text-xs tracking-wider text-foreground uppercase",
        className,
      )}
      style={bossEffectTint(effect)}
    >
      <BossEffectIcon effect={effect} />
      {name}
    </span>
  );
}

/** Fundo e borda de uma temporada: a cor do efeito da BAX passando para a do da BAL. */
export const seasonTint = (season: SeasonId): React.CSSProperties => {
  const { BAX, BAL } = SEASON_EFFECTS[season];
  const mix = (e: BossEffect, pct: number) => `color-mix(in oklch, ${BOSS_EFFECT_COLORS[e]} ${pct}%, transparent)`;
  return { borderColor: mix(BAX, 55), backgroundImage: `linear-gradient(90deg, ${mix(BAX, 16)}, ${mix(BAL, 16)})` };
};

/** Nome de uma temporada com os ícones dos dois efeitos (BAX e BAL). */
export function SeasonLabel({ season, colored = true }: { season: SeasonId; colored?: boolean }) {
  const { t } = useTranslation("common");
  const { BAX, BAL } = SEASON_EFFECTS[season];
  return (
    <>
      <span className="flex shrink-0 -space-x-0.5">
        <BossEffectIcon effect={BAX} colored={colored} />
        <BossEffectIcon effect={BAL} colored={colored} />
      </span>
      {t(`seasons.${season}`)}
    </>
  );
}

/**
 * Escolha de temporada (uma das 3): botões lado a lado no PC, empilhados no celular estreito.
 * `current` marca a temporada em andamento no jogo.
 */
export function SeasonPicker({
  value,
  onChange,
  current,
  label,
  className,
}: {
  value: SeasonId | null;
  onChange: (season: SeasonId) => void;
  current?: SeasonId | null;
  label: string;
  className?: string;
}) {
  const { t } = useTranslation("common");
  return (
    <div role="group" aria-label={label} className={cn("grid gap-1.5 sm:grid-cols-3", className)}>
      {SEASONS.map((s) => {
        const on = value === s;
        return (
          <button
            key={s}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(s)}
            className={cn(
              "flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-left text-xs transition-colors",
              on ? "font-medium text-foreground" : "border-border text-muted-foreground hover:border-spark/60 hover:text-foreground",
            )}
            style={on ? seasonTint(s) : undefined}
          >
            <SeasonLabel season={s} colored={on} />
            {current === s && (
              <span className="ml-auto shrink-0 rounded-full bg-spark/15 px-1.5 py-0.5 text-[0.6rem] font-semibold tracking-wider text-spark uppercase">
                {t("season.current")}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
