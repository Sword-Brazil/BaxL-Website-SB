import { useEffect, useState } from "react";
import { useTranslation } from "next-i18next/pages";
import { ArrowUpIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/** A partir de quanto rolado (px) o botão aparece: depois do primeiro dia, mais ou menos. */
const SHOW_AFTER = 600;

/** Botão flutuante "voltar ao topo" para telas longas (dias de BA): aparece só depois de rolar. */
export function ScrollToTopButton() {
  const { t } = useTranslation("common");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SHOW_AFTER);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toTop = () => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <Button
      type="button"
      variant="energy"
      size="icon"
      onClick={toTop}
      aria-label={t("scrollTop")}
      title={t("scrollTop")}
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
      className={cn(
        "fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 size-11 rounded-full shadow-lg transition-all duration-200 sm:right-6 sm:bottom-6",
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0",
      )}
    >
      <ArrowUpIcon className="size-5" />
    </Button>
  );
}
