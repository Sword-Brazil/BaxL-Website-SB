import { useTranslation } from "next-i18next/pages";
import { Badge } from "@/components/ui/badge";
import type { Criterion } from "@/models/domain/types";

const VARIANT: Record<string, "hero" | "villain" | "energy"> = { HERO: "hero", VILLAIN: "villain" };

/** Ícones de restrição em public/assets/restrictions (copiados de img/restrictions). */
const ICON: Record<string, string> = {
  HERO: "hero",
  VILLAIN: "villain",
  MALE: "male",
  FEMALE: "female",
  MUTANT: "mutant",
  HUMAN: "human",
  ALIEN: "alien",
  COMBAT: "combat",
  BLAST: "blast",
  SPEED: "speed",
  UNIVERSAL: "universal",
};

/** Critérios da restrição do dia (combinados com "E") ou "Sem restrição". */
export function RestrictionBadges({ criteria }: { criteria: Criterion[] }) {
  const { t } = useTranslation("common");
  if (criteria.length === 0) return <Badge variant="outline">{t("restriction.none")}</Badge>;
  return (
    <div className="flex flex-wrap items-center gap-1" aria-label={t("restriction.label")}>
      {criteria.map((c, i) => (
        <span key={c.attribute} className="flex items-center gap-1">
          {i > 0 && <span className="text-xs text-muted-foreground">+</span>}
          <Badge variant={VARIANT[c.value] ?? "energy"} className="h-6 gap-1 pl-1 tracking-wider uppercase">
            {ICON[c.value] && (
              // eslint-disable-next-line @next/next/no-img-element -- ícone estático de 16px
              <img src={`/assets/restrictions/${ICON[c.value]}.webp`} alt="" width={16} height={16} className="size-4" />
            )}
            {t(`values.${c.value}`)}
          </Badge>
        </span>
      ))}
    </div>
  );
}
