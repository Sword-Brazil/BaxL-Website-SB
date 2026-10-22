import { useEffect, useId, useRef, useState, useSyncExternalStore, type RefObject } from "react";
import { cn } from "@/lib/utils";
import type { CtpQuality } from "@/models/domain/enums";

/**
 * Brilho da qualidade do CTP, desenhado na área da própria imagem do CTP (dentro do Avatar,
 * que precisa de `isolate`): qualquer imagem cadastrada ganha o efeito.
 * Poderoso: estrelinhas de raios finos piscando devagar em volta da peça.
 * Brilhante: menos estrelas + uma galáxia roxa por trás da peça, que surge aos poucos e cuja
 * espiral gira bem devagar.
 * Fora da tela não anima; com "reduzir movimento" fica estático.
 * Desempenho (dezenas de CTPs na tela do PC): animações CSS só de opacidade e transform, e poucas
 * camadas animadas por CTP — as estrelas piscam em grupos e, na galáxia, só a espiral gira (com
 * will-change: desenhada uma vez e girada pela GPU). Nada de mix-blend nem blur animados.
 */

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";
const subscribeReduced = (onChange: () => void) => {
  const mq = window.matchMedia(REDUCED_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
};
const useReducedMotion = () =>
  useSyncExternalStore(subscribeReduced, () => window.matchMedia(REDUCED_QUERY).matches, () => false);

/** Só monta o efeito perto da área visível (um IntersectionObserver por CTP). */
function useNearViewport(ref: RefObject<HTMLElement | null>) {
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setNear(entry.isIntersecting), { rootMargin: "64px" });
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
  return near;
}

/** Estrelas em % da área da imagem, em volta da peça (que ocupa o centro). */
const SPARKLES = [
  { x: 20, y: 22, size: 22 },
  { x: 82, y: 30, size: 17 },
  { x: 78, y: 74, size: 19 },
  { x: 22, y: 70, size: 14 },
  { x: 56, y: 12, size: 16 },
  { x: 12, y: 46, size: 12 },
  { x: 88, y: 52, size: 13 },
  { x: 40, y: 86, size: 14 },
  { x: 66, y: 88, size: 11 },
  { x: 34, y: 10, size: 11 },
  { x: 70, y: 16, size: 10 },
] as const;

/** Estrela de quatro pontas com raios bem finos (o centro redondo é um círculo à parte). */
const STAR_PATH = "M12 0C12.12 9.8 14.2 11.88 24 12C14.2 12.12 12.12 14.2 12 24C11.88 14.2 9.8 12.12 0 12C9.8 11.88 11.88 9.8 12 0Z";

/** Paleta única da galáxia do Brilhante: do núcleo claro ao roxo profundo da borda. */
const GALAXY = { core: "#fdf2ff", glow: "#e2a6ff", bright: "#c45cff", main: "#9a2cf5", deep: "#6514c9" } as const;
const PURPLE_SOFT = "#d58bff";

/** Estrelas que piscam juntas: cada grupo é uma única camada animada (só opacidade). */
const TWINKLE_SECONDS = 3.2;

function Sparkle({ spec, color }: { spec: (typeof SPARKLES)[number]; color: string }) {
  const id = useId();
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

  return (
    <span className="absolute aspect-square" style={style}>
      {svg}
    </span>
  );
}

/** Estrelas em grupos que piscam defasados (ctp-twinkle); paradas, ficam acesas. */
function Sparkles({ specs, groups, color, still, phase }: { specs: readonly (typeof SPARKLES)[number][]; groups: number; color: string; still: boolean; phase: number }) {
  if (still) {
    return (
      <span className="absolute inset-0 opacity-80">
        {specs.map((spec, i) => (
          <Sparkle key={i} spec={spec} color={color} />
        ))}
      </span>
    );
  }
  return Array.from({ length: groups }, (_, g) => (
    <span
      key={g}
      className="ctp-twinkle absolute inset-0"
      style={{ animationDuration: `${TWINKLE_SECONDS}s`, animationDelay: `${(g * TWINKLE_SECONDS) / groups + phase}s` }}
    >
      {specs.map((spec, i) => (i % groups === g ? <Sparkle key={i} spec={spec} color={color} /> : null))}
    </span>
  ));
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
 * Galáxia roxa por trás da peça: nebulosa, véu e núcleo de luz parados; só os braços em espiral
 * e a poeira de estrelas giram devagar. A luz se espalha até sumir, sem borda. Surge aos poucos.
 */
function Galaxy({ still }: { still: boolean }) {
  const id = useId();
  return (
    <span className={cn("absolute inset-0 -z-10", !still && "ctp-galaxy-in")}>
      {/* Nebulosa: roxo vivo no centro que se dissolve só perto da borda. */}
      <span
        className="absolute inset-0"
        style={{
          background: `radial-gradient(closest-side, ${GALAXY.bright} 0%, ${GALAXY.main} 34%, color-mix(in srgb, ${GALAXY.deep} 85%, transparent) 58%, color-mix(in srgb, ${GALAXY.deep} 40%, transparent) 78%, color-mix(in srgb, ${GALAXY.deep} 10%, transparent) 91%, transparent 100%)`,
        }}
      />
      {/* Véu de nebulosa (parado): faixas mais claras que dão profundidade ao disco. */}
      <span
        className="absolute inset-0 opacity-60"
        style={{
          background: `conic-gradient(from 90deg, transparent 0deg, color-mix(in srgb, ${GALAXY.bright} 80%, transparent) 60deg, transparent 140deg, color-mix(in srgb, ${GALAXY.glow} 65%, transparent) 210deg, transparent 290deg)`,
          maskImage: "radial-gradient(closest-side, transparent 25%, black 55%, transparent 100%)",
        }}
      />
      {/* Braços em espiral + poeira: a única camada que gira. */}
      <span className={cn("absolute inset-0", !still && "ctp-spin")}>
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
                <path key={i} d={d} stroke={i === 1 ? GALAXY.glow : GALAXY.bright} strokeWidth={i === 1 ? 5 : 6.5} strokeOpacity={0.95} />
              ))}
            </g>
            {ARMS.map((d, i) => (
              <path key={i} d={d} fill="none" stroke={GALAXY.core} strokeWidth="1.1" strokeOpacity="0.85" strokeLinecap="round" />
            ))}
            {DUST.map((p, i) => (
              <circle key={i} cx={p.cx} cy={p.cy} r={p.r} fill="white" opacity={0.7 + (i % 3) * 0.15} />
            ))}
          </g>
        </svg>
      </span>
      {/* Núcleo: a luz que vem de trás da peça. */}
      <span
        className="absolute inset-0 rounded-full"
        style={{ background: `radial-gradient(circle, ${GALAXY.core} 0%, ${GALAXY.glow} 13%, color-mix(in srgb, ${GALAXY.bright} 70%, transparent) 27%, transparent 44%)` }}
      />
    </span>
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
  const inView = useNearViewport(ref);
  const reduced = useReducedMotion();
  // Fase aleatória por CTP, para que vários lado a lado não pisquem em sincronia.
  const [phase] = useState(() => Math.random() * 3);
  if (quality !== "MIGHTY" && quality !== "BRILLIANT") return null;
  const brilliant = quality === "BRILLIANT";
  // No Brilhante a galáxia é o destaque: menos estrelas, na cor dela.
  const sparkles = reduced ? SPARKLES.slice(0, 3) : brilliant ? SPARKLES.slice(0, 6) : SPARKLES;

  return (
    <span ref={ref} aria-hidden className={cn("pointer-events-none absolute inset-0", className)}>
      {inView && brilliant && <Galaxy still={reduced} />}
      {inView && (
        <Sparkles
          specs={sparkles}
          groups={brilliant ? 2 : 3}
          color={brilliant ? GALAXY.glow : (color ?? PURPLE_SOFT)}
          still={reduced}
          phase={phase}
        />
      )}
    </span>
  );
}
