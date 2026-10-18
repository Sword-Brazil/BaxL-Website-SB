import type { CtpQuality, CtpType } from "./enums";

/**
 * Cor de cada CTP (tipo × qualidade), usada para "pintar" o personagem com o CTP equipado.
 * 18 cores distintas, sem repetição. Fúria, Liberação, Percepção e Competição seguem o
 * Guia BAX/BAL/BAI; Julgamento (laranjas) e Salto (verdes) completam o conjunto.
 */
export const CTP_COLORS: Record<CtpType, Record<CtpQuality, string>> = {
  RAGE: { BRILLIANT: "#6600CC", MIGHTY: "#9966FF", NORMAL: "#CC99FF" },
  LIBERATION: { BRILLIANT: "#CC9900", MIGHTY: "#FFFF00", NORMAL: "#FFFF99" },
  INSIGHT: { BRILLIANT: "#CC0099", MIGHTY: "#FF00FF", NORMAL: "#FF99FF" },
  COMPETITION: { BRILLIANT: "#0000FF", MIGHTY: "#0066FF", NORMAL: "#3399FF" },
  JUDGEMENT: { BRILLIANT: "#CC4400", MIGHTY: "#FF7A1A", NORMAL: "#FFB37A" },
  ASCENT: { BRILLIANT: "#007A3D", MIGHTY: "#1FBF5F", NORMAL: "#8EE6AE" },
};

export const ctpColor = (ctp: { type: CtpType; quality: CtpQuality } | null | undefined) =>
  ctp ? CTP_COLORS[ctp.type][ctp.quality] : null;

/** Estilo de "pintura" de um personagem com o CTP equipado: borda, faixa lateral e fundo tingido. */
export function ctpTintStyle(color: string | null) {
  if (!color) return undefined;
  return {
    borderColor: color,
    boxShadow: `inset 4px 0 0 ${color}, 0 0 14px -6px ${color}`,
    backgroundColor: `color-mix(in oklch, ${color} 14%, transparent)`,
  };
}
