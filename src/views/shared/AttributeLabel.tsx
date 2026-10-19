import { useTranslation } from "next-i18next/pages";
import { cn } from "@/lib/utils";
import { attributeIcon } from "./attributeVisuals";

/** Ícone do atributo (herói, vilão, gênero, espécie, ataque); nada para valores sem ícone. */
export function AttributeIcon({ value, className }: { value: string; className?: string }) {
  const icon = attributeIcon(value);
  if (!icon) return null;
  // eslint-disable-next-line @next/next/no-img-element -- ícone estático de 16px
  return <img src={icon} alt="" width={16} height={16} className={cn("size-4 shrink-0", className)} />;
}

/** Ícone + nome do atributo, como nas restrições dos dias e nos atributos do traje. */
export function AttributeLabel({ value, className, iconClassName }: { value: string; className?: string; iconClassName?: string }) {
  const { t } = useTranslation("common");
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <AttributeIcon value={value} className={iconClassName} />
      {t(`values.${value}`)}
    </span>
  );
}
