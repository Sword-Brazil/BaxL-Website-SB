import { useTranslation } from "next-i18next/pages";
import { Field, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TEAM_SCOPES, type TeamScope } from "@/models/domain/enums";
import type { MetaScopeViewModel } from "@/viewmodels/admin/useMetaScopeViewModel";

/** Escolha do que editar: dias de BAX/BAL (quadro do ciclo), BAL livre ou BAI. */
export function MetaScopeBar({ vm, scopes = TEAM_SCOPES }: { vm: MetaScopeViewModel; scopes?: readonly TeamScope[] }) {
  const { t } = useTranslation("admin");
  return (
    <div className="rounded-xl bg-card/60 p-3 ring-1 ring-foreground/10">
      <Field className="w-full sm:w-64">
        <FieldLabel>{t("metas.scope")}</FieldLabel>
        <Select value={vm.scope} onValueChange={(v) => vm.setScope(v as TeamScope)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {scopes.map((s) => (
              <SelectItem key={s} value={s}>
                {t(`metas.scopes.${s}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    </div>
  );
}
