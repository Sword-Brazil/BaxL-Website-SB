import { useTranslation } from "next-i18next/pages";
import { Badge } from "@/components/ui/badge";
import type { Criterion } from "@/models/domain/types";
import { AttributeLabel } from "./AttributeLabel";
import { attributeVariant } from "./attributeVisuals";

/** Critérios da restrição do dia (todos valem juntos) ou "Sem restrição". */
export function RestrictionBadges({ criteria }: { criteria: Criterion[] }) {
  const { t } = useTranslation("common");
  if (criteria.length === 0) return <Badge variant="outline">{t("restriction.none")}</Badge>;
  return (
    <div className="flex flex-wrap items-center gap-1.5" aria-label={t("restriction.label")}>
      {criteria.map((c) => (
        <Badge key={c.attribute} variant={attributeVariant(c.value)} className="h-6 gap-1 pl-1 tracking-wider uppercase">
          <AttributeLabel value={c.value} />
        </Badge>
      ))}
    </div>
  );
}
