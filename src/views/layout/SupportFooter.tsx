import { useTranslation } from "next-i18next/pages";
import { CopyIcon, HeartHandshakeIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/** Chave Pix (celular) do dev, no formato que o Pix aceita ao colar; e como ela aparece na tela. */
const PIX_KEY = "+5521999922459";
const PIX_KEY_DISPLAY = "+55 (21) 99992-2459";

/** Aviso do dev único + chave Pix com botão de copiar (rodapé e botão "Apoiar" do cabeçalho). */
function SupportContent({ className }: { className?: string }) {
  const { t } = useTranslation("common");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(PIX_KEY);
      toast.success(t("footer.support.copied"));
    } catch {
      toast.error(t("footer.support.copyFailed"));
    }
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <p className="flex items-center gap-1.5 font-medium text-foreground">
        <HeartHandshakeIcon className="size-4 shrink-0 text-spark" />
        {t("footer.support.dev")}
      </p>
      <p className="text-muted-foreground">{t("footer.support.text")}</p>
      <div className="flex flex-wrap items-center gap-2">
        <code className="rounded bg-secondary px-2 py-1 font-mono text-foreground select-all">
          {t("footer.support.keyType")}: {PIX_KEY_DISPLAY}
        </code>
        <Button type="button" size="sm" variant="energy" onClick={copy}>
          <CopyIcon data-icon="inline-start" />
          {t("footer.support.copy")}
        </Button>
      </div>
    </div>
  );
}

/** Rodapé: o mesmo bloco de apoio, em destaque. */
export function SupportFooter() {
  return <SupportContent className="mt-2 rounded-lg border border-spark/30 bg-spark/5 p-3 text-xs" />;
}

/** Botão "Apoiar" do cabeçalho (visível em todas as telas): abre o aviso e a chave Pix. */
export function SupportButton() {
  const { t } = useTranslation("common");
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-spark/50 text-spark hover:bg-spark/10 hover:text-spark"
          aria-label={t("footer.support.button")}
        >
          <HeartHandshakeIcon data-icon="inline-start" />
          <span className="hidden sm:inline">{t("footer.support.button")}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 max-w-[calc(100vw-2rem)] text-sm">
        <SupportContent />
      </PopoverContent>
    </Popover>
  );
}
