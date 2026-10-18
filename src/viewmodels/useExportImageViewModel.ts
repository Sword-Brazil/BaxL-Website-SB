import { useRef, useState } from "react";
import { toPng } from "html-to-image";

/** Exporta um trecho da tela como PNG (equipe ou grade de dias) para compartilhar. */
export function useExportImageViewModel<T extends HTMLElement = HTMLDivElement>(name: string) {
  const ref = useRef<T>(null);
  const [isExporting, setIsExporting] = useState(false);

  const exportPng = async () => {
    if (!ref.current) return;
    setIsExporting(true);
    try {
      const background = getComputedStyle(document.body).backgroundColor;
      const dataUrl = await toPng(ref.current, { pixelRatio: 2, cacheBust: true, backgroundColor: background });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `mff-${name}-${new Date().toISOString().slice(0, 10)}.png`;
      a.click();
    } finally {
      setIsExporting(false);
    }
  };

  return { ref, exportPng, isExporting };
}
