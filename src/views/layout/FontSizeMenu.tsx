import { useState } from "react";
import { useTranslation } from "next-i18next/pages";
import { ALargeSmallIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const FONT_SIZES = ["sm", "md", "lg"] as const;
type FontSize = (typeof FONT_SIZES)[number];

const STORAGE_KEY = "mff-font-size";

/** Roda no <head> antes da primeira pintura: aplica o tamanho salvo neste aparelho. */
export const FONT_SIZE_SCRIPT = `try{var s=localStorage.getItem("${STORAGE_KEY}");if(s==="sm"||s==="lg")document.documentElement.dataset.fontSize=s}catch(e){}`;

function currentFontSize(): FontSize {
  if (typeof document === "undefined") return "md";
  const value = document.documentElement.dataset.fontSize;
  return value === "sm" || value === "lg" ? value : "md";
}

function applyFontSize(size: FontSize) {
  if (size === "md") delete document.documentElement.dataset.fontSize;
  else document.documentElement.dataset.fontSize = size;
  try {
    localStorage.setItem(STORAGE_KEY, size);
  } catch {
    // Sem armazenamento (aba privada): vale só até recarregar.
  }
}

/** Tamanho da fonte do app todo (Pequena, Média, Grande), salvo neste aparelho. */
export function FontSizeMenu({ className }: { className?: string }) {
  const { t } = useTranslation("common");
  const [size, setSize] = useState<FontSize>(currentFontSize);
  return (
    <DropdownMenu onOpenChange={(open) => open && setSize(currentFontSize())}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-touch" className={className} aria-label={t("fontSize.label")}>
          <ALargeSmallIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{t("fontSize.label")}</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={size}
          onValueChange={(value) => {
            const next = value as FontSize;
            applyFontSize(next);
            setSize(next);
          }}
        >
          {FONT_SIZES.map((s) => (
            <DropdownMenuRadioItem key={s} value={s}>
              {t(`fontSize.${s}`)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
