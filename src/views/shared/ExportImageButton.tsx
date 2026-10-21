import { useTranslation } from "next-i18next/pages";
import { ImageDownIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Hint } from "./Hint";

export function ExportImageButton({ onExport, disabled }: { onExport: () => void; disabled?: boolean }) {
  const { t } = useTranslation("common");
  return (
    <Hint label={t("actions.exportImage")}>
      <Button size="icon-sm" variant="ghost" onClick={onExport} disabled={disabled} aria-label={t("actions.exportImage")}>
        <ImageDownIcon />
      </Button>
    </Hint>
  );
}
