import { useId, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import type { CtpQuality } from "@/models/domain/enums";

/**
 * Brilho da qualidade do CTP, desenhado na área da própria imagem do CTP (dentro do Avatar,
 * que precisa de `isolate`): qualquer imagem cadastrada ganha o efeito.
 * Poderoso: estrelinhas de raios finos piscando devagar em volta da peça.
 * Brilhante: as mesmas estrelas + uma galáxia roxa por trás da peça, que surge aos poucos,
 * fica e gira bem devagar.
 * Fora da tela não anima; com "reduzir movimento" fica estático.
 */

/** Estrelas em % da área da imagem, em volta da peça (que ocupa o centro). */
const SPARKLES = [
  { x: 20, y: 22, size: 22, delay: 0, duration: 2.4 },
  { x: 82, y: 30, size: 17, delay: 1.4, duration: 2.8 },
  { x: 78, y: 74, size: 19, delay: 2.6, duration: 2.5 },
  { x: 22, y: 70, size: 14, delay: 0.8, duration: 2.9 },
  { x: 56, y: 12, size: 16, delay: 2, duration: 2.6 },
  { x: 12, y: 46, size: 12, delay: 3.1, duration: 2.3 },
  { x: 88, y: 52, size: 13, delay: 0.4, duration: 2.7 },
  { x: 40, y: 86, size: 14, delay: 1.7, duration: 2.8 },
  { x: 66, y: 88, size: 11, delay: 3.4, duration: 2.4 },
  { x: 34, y: 10, size: 11, delay: 2.9, duration: 2.7 },
  { x: 70, y: 16, size: 10, delay: 0.2, duration: 2.5 },
] as const;

/** Estrela de quatro pontas com raios bem finos (o centro redondo é um círculo à parte). */
const STAR_PATH = "M12 0C12.12 9.8 14.2 11.88 24 12C14.2 12.12 12.12 14.2 12 24C11.88 14.2 9.8 12.12 0 12C9.8 11.88 11.88 9.8 12 0Z";

const PURPLE = "#b026ff";
const PURPLE_SOFT = "#d58bff";

function Sparkle({ spec, color, still, phase }: { spec: (typeof SPARKLES)[number]; color: string; still: boolean; phase: number }) {
  const id = useId();
  // Centraliza pela margem (não por transform), para a animação só mexer em escala e opacidade.
  const style = {
    left: `${spec.x}%`,
    top: `${spec.y}%`,
    width: `${spec.size}%`,
    marginLeft: `${-spec.size / 2}%`,
    marginTop: `${-spec.size / 2}%`,
  };
  const svg = (
    <svg viewBox="0 0 24 24" className="size-full overflow-visible">
      <defs>
        <radialGradient id={id}>
          <stop offset="0%" stopColor={color} stopOpacity="0.9" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="12" cy="12" r="6" fill={`url(#${id})`} />
      <path d={STAR_PATH} fill={`color-mix(in oklch, ${color} 20%, white)`} />
      <circle cx="12" cy="12" r="2.8" fill={`color-mix(in oklch, ${color} 15%, white)`} />
      <circle cx="12" cy="12" r="1.7" fill="white" />
    </svg>
  );

  if (still) {
    return (
      <span className="absolute aspect-square opacity-80" style={style}>
        {svg}
      </span>
    );
  }
  return (
    <motion.span
      className="absolute aspect-square will-change-transform"
      style={style}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: [0, 1, 1, 0], scale: [0.5, 1, 1, 0.5] }}
      transition={{ duration: spec.duration, delay: spec.delay + phase, times: [0, 0.2, 0.75, 1], repeat: Infinity, repeatDelay: 0.6, ease: "easeInOut" }}
    >
      {svg}
    </motion.span>
  );
}

/** Braço da galáxia: espiral logarítmica em volta do centro (viewBox 100×100). */
function spiralArm(offset: number) {
  const points: string[] = [];
  for (let i = 0; i <= 48; i++) {
    const t = (i / 48) * Math.PI * 1.6;
    const r = 5 * Math.exp(0.43 * t);
    points.push(`${(50 + r * Math.cos(t + offset)).toFixed(2)},${(50 + r * Math.sin(t + offset)).toFixed(2)}`);
  }
  return `M${points.join("L")}`;
}
const ARMS = [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].map(spiralArm);

/** Poeira de estrelas no disco: posições fixas (pseudoaleatórias) em coordenadas polares. */
const DUST = Array.from({ length: 22 }, (_, i) => {
  const angle = i * 2.399; // ângulo de ouro: espalha sem formar padrão
  const radius = 8 + ((i * 37) % 36);
  return { cx: 50 + radius * Math.cos(angle), cy: 50 + radius * Math.sin(angle), r: 0.5 + ((i * 13) % 5) * 0.18 };
});

/**
 * Galáxia roxa por trás da peça: núcleo de luz, braços em espiral e poeira de estrelas girando
 * devagar; a luz se espalha até sumir, sem borda. Surge aos poucos e fica.
 */
function Galaxy({ still }: { still: boolean }) {
  const id = useId();
  const spin = (duration: number, reverse = false) =>
    still ? {} : { animate: { rotate: reverse ? -360 : 360 }, transition: { duration, repeat: Infinity, ease: "linear" as const } };
  return (
    <motion.span
      className="absolute inset-0 -z-10"
      initial={{ opacity: still ? 1 : 0, scale: still ? 1 : 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 2.4, delay: 0.8, ease: "easeOut" }}
    >
      {/* Fundo: nebulosa roxa viva que se dissolve só perto da borda. */}
      <span
        className="absolute inset-0"
        style={{
          background: `radial-gradient(closest-side, #c13cff 0%, #8f1fff 32%, color-mix(in srgb, #7a12f0 85%, transparent) 55%, color-mix(in srgb, #7a12f0 45%, transparent) 76%, color-mix(in srgb, #7a12f0 12%, transparent) 90%, transparent 100%)`,
        }}
      />
      {/* Braços em espiral + poeira, girando devagar. */}
      <motion.span className="absolute inset-0 will-change-transform" {...spin(30)}>
        <svg viewBox="0 0 100 100" className="size-full">
          <defs>
            <filter id={`${id}-blur`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.1" />
            </filter>
            <radialGradient id={`${id}-fade`}>
              <stop offset="0%" stopColor="white" />
              <stop offset="60%" stopColor="white" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </radialGradient>
            <mask id={`${id}-mask`}>
              <circle cx="50" cy="50" r="50" fill={`url(#${id}-fade)`} />
            </mask>
          </defs>
          <g mask={`url(#${id}-mask)`}>
            <g filter={`url(#${id}-blur)`} fill="none" strokeLinecap="round">
              {ARMS.map((d, i) => (
                <path key={i} d={d} stroke={i === 1 ? "#e040fb" : "#c94dff"} strokeWidth={i === 1 ? 5 : 6.5} strokeOpacity={0.95} />
              ))}
            </g>
            {ARMS.map((d, i) => (
              <path key={i} d={d} fill="none" stroke="#f7d6ff" strokeWidth="1.1" strokeOpacity="0.85" strokeLinecap="round" />
            ))}
            {DUST.map((p, i) => (
              <circle key={i} cx={p.cx} cy={p.cy} r={p.r} fill="white" opacity={0.7 + (i % 3) * 0.15} />
            ))}
          </g>
        </svg>
      </motion.span>
      {/* Véu de nebulosa girando ao contrário, para dar profundidade. */}
      <motion.span
        className="absolute inset-0 mix-blend-screen blur-[1px]"
        style={{
          background: `conic-gradient(from 90deg, transparent 0deg, #9d2bffdd 60deg, transparent 140deg, #f472ffaa 210deg, transparent 290deg)`,
          maskImage: "radial-gradient(closest-side, transparent 25%, black 55%, transparent 100%)",
        }}
        {...spin(48, true)}
      />
      {/* Núcleo: a luz que vem de trás da peça, respirando devagar. */}
      <motion.span
        className="absolute inset-0 rounded-full mix-blend-screen"
        style={{ background: `radial-gradient(circle, #fdf4ff 0%, #e48bff 12%, color-mix(in srgb, ${PURPLE} 75%, transparent) 26%, transparent 42%)` }}
        animate={still ? undefined : { opacity: [0.75, 1, 0.75], scale: [0.92, 1.05, 0.92] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.span>
  );
}

export function CtpQualityFx({
  quality,
  color,
  className,
}: {
  quality: CtpQuality | null | undefined;
  /** Cor do CTP (tipo × qualidade): tinge o brilho das estrelas do Poderoso. */
  color?: string | null;
  /** Mesma área da imagem dentro do Avatar (ex.: `inset-px` quando a imagem tem `p-px`). */
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { margin: "64px" });
  const reduced = useReducedMotion() ?? false;
  // Fase aleatória por CTP, para que vários lado a lado não pisquem em sincronia.
  const [phase] = useState(() => Math.random() * 3);
  if (quality !== "MIGHTY" && quality !== "BRILLIANT") return null;
  const brilliant = quality === "BRILLIANT";
  const sparkles = reduced ? SPARKLES.slice(0, 3) : SPARKLES;

  return (
    <span ref={ref} aria-hidden className={cn("pointer-events-none absolute inset-0", className)}>
      {inView && brilliant && <Galaxy still={reduced} />}
      {inView &&
        sparkles.map((spec, i) => (
          <Sparkle key={i} spec={spec} color={brilliant ? PURPLE_SOFT : (color ?? PURPLE_SOFT)} still={reduced} phase={phase} />
        ))}
    </span>
  );
}
