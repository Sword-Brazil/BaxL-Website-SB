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

/** Ícone do jogo de cada efeito, em public/assets/effects. */
const ICON: Record<BossEffect, string> = {
  SILENCE: "silence",
  PARALYSIS: "paralysis",
  BURN: "burn",
  FRACTURE: "fracture",
  SHOCK: "shock",
  TRAP: "trap",
};

/** Ícone do efeito; `colored={false}` apaga o ícone (efeito não escolhido). */
export function BossEffectIcon({ effect, className, colored = true }: { effect: BossEffect; className?: string; colored?: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- ícone estático de 16px
    <img
      src={`/assets/effects/${ICON[effect]}.webp`}
      alt=""
      aria-hidden
      width={16}
      height={16}
      className={cn("size-4 shrink-0 rounded-[3px]", !colored && "opacity-60 grayscale", className)}
    />
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
        // Cantos pouco arredondados: o ícone do jogo é quadrado e fica encostado na borda.
        "inline-flex h-6 shrink-0 items-center gap-1.5 rounded-md border py-0.5 pr-2 pl-0.5 font-heading text-xs tracking-wider text-foreground uppercase",
        className,
      )}
      style={bossEffectTint(effect)}
    >
      <BossEffectIcon effect={effect} className="size-[1.125rem]" />
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
      <span className="flex shrink-0 gap-0.5">
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
