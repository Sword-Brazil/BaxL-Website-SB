import { useTranslation } from "next-i18next/pages";
import { cn } from "@/lib/utils";
import { RotateCcwIcon, SaveIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CRITERION_ATTRIBUTES, CRITERION_VALUES, DAY_MODES, type DayMode } from "@/models/domain/enums";
import { MODE_VISUALS } from "@/views/shared/modeVisuals";
import { ANY, useRestrictionEditorViewModel } from "@/viewmodels/admin/useRestrictionEditorViewModel";
import { QueryState } from "@/views/shared/QueryState";

function ModeDays({ mode }: { mode: DayMode }) {
  const { t } = useTranslation(["admin", "common"]);
  const vm = useRestrictionEditorViewModel(mode, { saved: t("admin:common.saved"), error: t("admin:common.error") });

  return (
    <QueryState isLoading={vm.isLoading} isError={vm.isError} retry={vm.retry}>
      {/* Um cartão por dia: os 4 critérios em grade (2 colunas no celular, 4 no PC). */}
      <ul className="grid gap-3 xl:grid-cols-2">
        {vm.rows.map((row) => (
          <li
            key={row.number}
            className={cn(
              "flex flex-col gap-3 rounded-xl p-3 ring-1 ring-foreground/10",
              row.dirty && "bg-energy/5 ring-energy/50",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-heading font-semibold whitespace-nowrap">
                {t("common:day", { number: row.number })}{" "}
                <span className="text-xs text-muted-foreground">{t(`common:weekdays.${row.weekday}`)}</span>
              </span>
              <span className="flex items-center gap-1">
                <Button size="icon-sm" variant="ghost" disabled={!row.dirty} onClick={row.reset} aria-label={t("admin:common.cancel")}>
                  <RotateCcwIcon />
                </Button>
                <Button size="sm" disabled={!row.dirty || vm.savingDay === row.number} onClick={row.save}>
                  <SaveIcon data-icon="inline-start" />
                  {t("admin:common.save")}
                </Button>
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {CRITERION_ATTRIBUTES.map((a) => (
                <label key={a} className="flex min-w-0 flex-col gap-1">
                  <span className="text-xs text-muted-foreground">{t(`common:attributes.${a}`)}</span>
                  <Select value={row.draft[a]} onValueChange={(v) => row.setValue(a, v)}>
                    <SelectTrigger className="w-full" aria-label={`${t(`common:attributes.${a}`)} · ${row.number}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ANY}>{t("admin:days.any")}</SelectItem>
                      {CRITERION_VALUES[a].map((v) => (
                        <SelectItem key={v} value={v}>
                          {t(`common:values.${v}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </QueryState>
  );
}

export function RestrictionEditorView() {
  return (
    <Tabs defaultValue="BAX">
      <TabsList>
        {DAY_MODES.map((m) => (
          <TabsTrigger key={m} value={m} className={cn("font-heading tracking-wider", MODE_VISUALS[m].active)}>
            {m}
          </TabsTrigger>
        ))}
      </TabsList>
      {DAY_MODES.map((m) => (
        <TabsContent key={m} value={m}>
          <ModeDays mode={m} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
