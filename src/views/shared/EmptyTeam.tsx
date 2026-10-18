import { useTranslation } from "next-i18next/pages";
import { ShieldQuestionIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function EmptyTeam() {
  const { t } = useTranslation("common");
  return (
    <Card variant="panel" className="border-dashed">
      <CardContent className="flex items-center gap-3 text-muted-foreground">
        <ShieldQuestionIcon className="size-6 text-energy/70" />
        <span className="font-heading tracking-wide">{t("team.empty")}</span>
      </CardContent>
    </Card>
  );
}
