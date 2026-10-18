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

/**
 * Uma linha de badges por atributo. Sem `inherited` (personagem): escolhe o valor, incluindo
 * "Não informado". Com `inherited` (traje): o valor herdado aparece tracejado; tocar em outro
 * valor personaliza só o traje e tocar no herdado (ou no personalizado) volta a herdar (null).
 */
export function AttributeBadgePicker({
  field,
  value,
  inherited,
  onChange,
}: {
  field: Field;
  value: string | null;
  inherited?: string;
  onChange: (value: string | null) => void;
}) {
  const { t } = useTranslation("common");
  const isUniform = inherited !== undefined;
  const effective = value ?? inherited;
  const options: readonly string[] = isUniform ? field.values : [...field.values, UNKNOWN];

  const pick = (v: string) => {
    if (!isUniform) return onChange(v);
    onChange(v === value || v === inherited ? null : v);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{t(`attributes.${field.attr}`)}</span>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label={t(`attributes.${field.attr}`)}>
        {options.map((v) => {
          const selected = v === effective;
          const icon = attributeIcon(v);
          return (
            <button
              key={v}
              type="button"
              aria-pressed={selected}
              onClick={() => pick(v)}
              className={cn(
                badgeVariants({ variant: selected ? (v === UNKNOWN ? "outline" : attributeVariant(v)) : "outline" }),
                "h-7 cursor-pointer gap-1 px-2 transition-opacity",
                icon && "pl-1",
                !selected && "opacity-55 hover:opacity-100",
                selected && isUniform && value === null && "border-dashed",
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
