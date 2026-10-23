import { useTranslation } from "next-i18next/pages";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import shots from "./guideShots.json";

// Prints do guia em public/guide: `<tela>-<desktop|mobile>-<dark|light>.jpg`. As marcações (em %
// da imagem) vêm do próprio DOM na hora do print, em guideShots.json.
export type GuideShotId = keyof typeof shots;
type Variant = "desktop" | "mobile";
interface Marker {
  n: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Uma variante do print (PC ou celular), com a imagem do tema atual e as marcações por cima. */
function Shot({ id, variant, name, className }: { id: GuideShotId; variant: Variant; name: string; className?: string }) {
  const { t } = useTranslation("about");
  const { resolvedTheme } = useTheme();
  const shot = shots[id][variant];
  const src = (theme: "dark" | "light") => `/guide/${id}-${variant}-${theme}.jpg`;
  return (
    // Respiro em volta: os números ficam no canto do que marcam e podem passar da borda do print.
    <figure className={cn("p-3", className)}>
      <div className="relative">
        <a
          href={src(resolvedTheme === "light" ? "light" : "dark")}
          target="_blank"
          rel="noreferrer"
          aria-label={t("zoom")}
          className="block overflow-hidden rounded-lg ring-1 ring-foreground/10 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {(["light", "dark"] as const).map((theme) => (
            // eslint-disable-next-line @next/next/no-img-element -- prints já comprimidos; o do outro tema fica oculto e, com lazy, nem baixa
            <img
              key={theme}
              src={src(theme)}
              alt={t("shotAlt", { name })}
              width={shot.width}
              height={shot.height}
              loading="lazy"
              decoding="async"
              className={cn("h-auto w-full", theme === "dark" ? "hidden dark:block" : "dark:hidden")}
            />
          ))}
        </a>
        <div aria-hidden className="pointer-events-none absolute inset-0">
          {(shot.markers as Marker[]).map((m) => (
            <span key={m.n}>
              <span
                className="absolute rounded-md ring-2 ring-spark shadow-[0_0_0_3px_color-mix(in_oklch,var(--spark)_25%,transparent)]"
                style={{ left: `${m.x}%`, top: `${m.y}%`, width: `${m.w}%`, height: `${m.h}%` }}
              />
              <span
                // Fora do canto de cima à esquerda (encostando nele), para não cobrir o texto marcado.
                className="absolute flex size-6 translate-x-[calc(-100%+6px)] translate-y-[calc(-100%+6px)] items-center justify-center rounded-full bg-spark font-heading text-xs font-bold text-white shadow-md ring-2 ring-background"
                style={{ left: `${m.x}%`, top: `${m.y}%` }}
              >
                {m.n}
              </span>
            </span>
          ))}
        </div>
      </div>
    </figure>
  );
}

/** Print da tela com marcações numeradas: o do celular em telas pequenas, o do PC nas maiores. */
export function AnnotatedShot({ id, name }: { id: GuideShotId; name: string }) {
  return (
    <>
      <Shot id={id} variant="mobile" name={name} className="mx-auto w-full max-w-sm sm:hidden" />
      <Shot id={id} variant="desktop" name={name} className="hidden sm:block" />
    </>
  );
}
