import { useTranslation } from "next-i18next/pages";
import { CopyIcon, HeartHandshakeIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

// Fora do repositório (que é público): definida na Vercel. Sem ela, o bloco de apoio não aparece.
const PIX_KEY = process.env.NEXT_PUBLIC_PIX_KEY ?? "";
const PIX_KEY_TYPE = process.env.NEXT_PUBLIC_PIX_KEY_TYPE ?? "";

/** Rodapé: o sistema é feito por um único dev, com a chave Pix para quem quiser ajudar no Pack Stark. */
export function SupportFooter() {
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
    <div className="mt-2 flex flex-col gap-2 rounded-lg border border-energy/15 bg-card/40 p-3">
      <p className="flex items-center gap-1.5 text-foreground/80">
        <HeartHandshakeIcon className="size-3.5 text-energy" />
        {t("footer.support.dev")}
      </p>
      {PIX_KEY && (
        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
          <p>{t("footer.support.text")}</p>
          <div className="flex items-center gap-2">
            <code className="rounded bg-secondary px-2 py-1 font-mono text-foreground select-all">
              {PIX_KEY_TYPE ? `${PIX_KEY_TYPE}: ` : ""}
              {PIX_KEY}
            </code>
            <Button type="button" size="sm" variant="outline" onClick={copy}>
              <CopyIcon data-icon="inline-start" />
              {t("footer.support.copy")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
