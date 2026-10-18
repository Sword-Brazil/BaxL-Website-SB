import { useTranslation } from "next-i18next/pages";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CTP_TYPES } from "@/models/domain/enums";
import type { Ctp } from "@/models/domain/types";

export const NO_CTP = "NONE";

/** Select de CTP (tipo × qualidade), agrupado por tipo. */
export function CtpSelect({
  ctps,
  value,
  onChange,
  allowNone,
  placeholder,
  ariaLabel,
}: {
  ctps: Ctp[];
  value: string | null;
  onChange: (ctpId: string | null) => void;
  allowNone?: boolean;
  placeholder: string;
  ariaLabel?: string;
}) {
  const { t } = useTranslation("common");
  return (
    <Select value={value ?? (allowNone ? NO_CTP : undefined)} onValueChange={(v) => onChange(v === NO_CTP ? null : v)}>
      <SelectTrigger className="w-full" aria-label={ariaLabel}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {allowNone && <SelectItem value={NO_CTP}>—</SelectItem>}
        {CTP_TYPES.map((type) => (
          <SelectGroup key={type}>
            <SelectLabel>{t(`ctp.${type}`)}</SelectLabel>
            {ctps
              .filter((c) => c.active && c.type === type)
              .map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {t(`ctp.${c.type}`)} · {t(`quality.${c.quality}`)}
                </SelectItem>
              ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}
