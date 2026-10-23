import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRightIcon, CircleHelpIcon } from "lucide-react";
import { useTranslation } from "next-i18next/pages";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverHeader, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";

/** Ajuda curta da tela (FR-030), com o link para a seção da tela no guia (/sobre). */
export function HelpHint({ title, children, guide }: { title: string; children: ReactNode; guide?: string }) {
  const { t } = useTranslation("common");
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={t("actions.help")}>
          <CircleHelpIcon />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 text-sm">
        <PopoverHeader>
          <PopoverTitle>{title}</PopoverTitle>
        </PopoverHeader>
        <div className="space-y-2 text-muted-foreground">{children}</div>
        <Link
          href={`/sobre${guide ? `#${guide}` : ""}`}
          className="flex items-center gap-1 text-xs font-medium text-energy underline-offset-4 hover:underline"
        >
          {t("actions.fullGuide")}
          <ArrowRightIcon className="size-3.5" />
        </Link>
      </PopoverContent>
    </Popover>
  );
}
