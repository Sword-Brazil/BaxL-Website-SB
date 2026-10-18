import { useTranslation } from "next-i18next/pages";
import { Field, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BATTLE_DAY_NUMBERS, DAY_MODES, TEAM_SCOPES, weekdayOf, type DayMode, type TeamScope } from "@/models/domain/enums";
import type { MetaScopeViewModel } from "@/viewmodels/admin/useMetaScopeViewModel";
import { RestrictionBadges } from "@/views/shared/RestrictionBadges";

/** Seleção do escopo em edição: Dia de BAX/BAL (modo + dia), BAL livre ou BAI. */
export function MetaScopeBar({ vm, scopes = TEAM_SCOPES }: { vm: MetaScopeViewModel; scopes?: readonly TeamScope[] }) {
  const { t } = useTranslation(["admin", "common"]);
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl bg-card/60 p-3 ring-1 ring-foreground/10">
      <Field className="w-48">
        <FieldLabel>{t("admin:metas.scope")}</FieldLabel>
        <Select value={vm.scope} onValueChange={(v) => vm.setScope(v as TeamScope)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {scopes.map((s) => (
              <SelectItem key={s} value={s}>
                {t(`admin:metas.scopes.${s}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      {vm.isDay && (
        <>
          <Field className="w-28">
            <FieldLabel>{t("admin:metas.mode")}</FieldLabel>
            <Select value={vm.mode} onValueChange={(v) => vm.setMode(v as DayMode)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DAY_MODES.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field className="w-36">
            <FieldLabel>{t("admin:metas.day")}</FieldLabel>
            <Select value={String(vm.number)} onValueChange={(v) => vm.setNumber(Number(v))}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BATTLE_DAY_NUMBERS.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {t("common:day", { number: n })} · {t(`common:weekdays.${weekdayOf(n)}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <div className="pb-2">
            <RestrictionBadges criteria={vm.criteria} />
          </div>
        </>
      )}
    </div>
  );
}
