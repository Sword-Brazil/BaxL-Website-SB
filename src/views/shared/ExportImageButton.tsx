import { useTranslation } from "next-i18next/pages";
import { ImageDownIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ExportImageButton({ onExport, disabled }: { onExport: () => void; disabled?: boolean }) {
  const { t } = useTranslation("common");
  return (
    <Button size="icon-sm" variant="ghost" onClick={onExport} disabled={disabled} aria-label={t("actions.exportImage")} title={t("actions.exportImage")}>
      <ImageDownIcon />
    </Button>
  );
}
