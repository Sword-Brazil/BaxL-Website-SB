import type { ReactNode } from "react";
import { CircleHelpIcon } from "lucide-react";
import { useTranslation } from "next-i18next/pages";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverHeader, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";

/** Ajuda curta da tela (FR-030). */
export function HelpHint({ title, children }: { title: string; children: ReactNode }) {
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
      </PopoverContent>
    </Popover>
  );
}
