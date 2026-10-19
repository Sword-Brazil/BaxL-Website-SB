import { useTranslation } from "next-i18next/pages";
import { cn } from "@/lib/utils";
import { badgeVariants } from "@/components/ui/badge";
import { ATTACK_TYPES, GENDERS, SIDES, SPECIES, UNKNOWN, type CriterionAttribute } from "@/models/domain/enums";
import type { RestrictableAttributes } from "@/models/domain/types";
import { attributeIcon, attributeVariant } from "@/views/shared/attributeVisuals";

export const ATTRIBUTE_FIELDS = [
  { name: "gender", attr: "GENDER", values: GENDERS },
  { name: "side", attr: "SIDE", values: SIDES },
  { name: "species", attr: "SPECIES", values: SPECIES },
  { name: "attackType", attr: "ATTACK_TYPE", values: ATTACK_TYPES },
] as const satisfies readonly { name: keyof RestrictableAttributes; attr: CriterionAttribute; values: readonly string[] }[];

type Field = (typeof ATTRIBUTE_FIELDS)[number];

/** Uma linha de badges por atributo do traje, incluindo "Não informado" (não bloqueia restrições). */
export function AttributeBadgePicker({
  field,
  value,
  onChange,
}: {
  field: Field;
  value: string;
  onChange: (value: string) => void;
}) {
  const { t } = useTranslation("common");
  const options: readonly string[] = [...field.values, UNKNOWN];

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{t(`attributes.${field.attr}`)}</span>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label={t(`attributes.${field.attr}`)}>
        {options.map((v) => {
          const selected = v === value;
          const icon = attributeIcon(v);
          return (
            <button
              key={v}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(v)}
              className={cn(
                badgeVariants({ variant: selected ? (v === UNKNOWN ? "outline" : attributeVariant(v)) : "outline" }),
                "h-7 cursor-pointer gap-1 px-2 transition-opacity",
                icon && "pl-1",
                !selected && "opacity-55 hover:opacity-100",
                selected && v === UNKNOWN && "text-spark",
              )}
            >
              {icon && (
                // eslint-disable-next-line @next/next/no-img-element -- ícone estático de 16px
                <img src={icon} alt="" width={16} height={16} className={cn("size-4", !selected && "grayscale")} />
              )}
              {t(`values.${v}`)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
