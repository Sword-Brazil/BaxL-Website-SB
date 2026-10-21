import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Uniform } from "@/models/domain/types";

const FRAME_BY_SIDE: Record<string, string> = { HERO: "bg-hero/70", VILLAIN: "bg-villain/70" };

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();

/** Foto do traje com a moldura do lado (herói/vilão); sem traje, a foto principal do personagem. */
export function UniformPreview({
  uniform,
  name,
  fallbackSrc,
  className,
}: {
  uniform: Uniform | null;
  name: string;
  fallbackSrc?: string;
  className?: string;
}) {
  return (
    <div className={cn("chamfer-sm shrink-0 p-[2px]", (uniform && FRAME_BY_SIDE[uniform.side]) ?? "bg-border", className)}>
      <Avatar className="chamfer-sm size-full rounded-none after:hidden">
        <AvatarImage src={(uniform?.portrait ?? fallbackSrc) || undefined} alt="" loading="lazy" decoding="async" className="rounded-none" />
        <AvatarFallback className="rounded-none bg-secondary font-heading">{initials(name)}</AvatarFallback>
      </Avatar>
    </div>
  );
}
