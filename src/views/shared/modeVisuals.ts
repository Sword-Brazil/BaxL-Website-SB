import type { Mode } from "@/models/domain/enums";

/**
 * Cores fixas de cada modo, como no jogo: BAX azul, BAL laranja, BAI vermelho.
 * Classes escritas por extenso para o Tailwind encontrá-las.
 */
export const MODE_VISUALS: Record<
  Mode,
  { badge: "bax" | "bal" | "bai"; text: string; border: string; accentBar: string; tint: string; ring: string; active: string }
> = {
  BAX: {
    badge: "bax",
    text: "text-bax",
    border: "border-bax/40",
    accentBar: "border-t-bax",
    tint: "bg-linear-to-b from-bax/10 via-bax/[0.03] to-transparent",
    ring: "ring-bax/40",
    active: "data-[state=active]:text-bax data-[state=on]:border-bax/60 data-[state=on]:bg-bax/15 data-[state=on]:text-bax",
  },
  BAL: {
    badge: "bal",
    text: "text-bal",
    border: "border-bal/40",
    accentBar: "border-t-bal",
    tint: "bg-linear-to-b from-bal/10 via-bal/[0.03] to-transparent",
    ring: "ring-bal/40",
    active: "data-[state=active]:text-bal data-[state=on]:border-bal/60 data-[state=on]:bg-bal/15 data-[state=on]:text-bal",
  },
  BAI: {
    badge: "bai",
    text: "text-bai",
    border: "border-bai/40",
    accentBar: "border-t-bai",
    tint: "bg-linear-to-b from-bai/12 via-bai/[0.04] to-transparent",
    ring: "ring-bai/40",
    active: "data-[state=active]:text-bai data-[state=on]:border-bai/60 data-[state=on]:bg-bai/15 data-[state=on]:text-bai",
  },
};
