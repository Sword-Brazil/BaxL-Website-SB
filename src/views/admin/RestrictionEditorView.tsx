import { useTranslation } from "next-i18next/pages";
import { cn } from "@/lib/utils";
import { AttributeLabel } from "@/views/shared/AttributeLabel";
import { RotateCcwIcon, SaveIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CRITERION_ATTRIBUTES, CRITERION_VALUES, DAY_MODES, EFFECTS_BY_MODE, type BossEffect, type DayMode } from "@/models/domain/enums";
import { MODE_VISUALS } from "@/views/shared/modeVisuals";
import { ANY, useRestrictionEditorViewModel } from "@/viewmodels/admin/useRestrictionEditorViewModel";
import { QueryState } from "@/views/shared/QueryState";
import { BossEffectBadge, BossEffectIcon } from "@/views/shared/BossEffect";
import { useSeasonEditorViewModel } from "@/viewmodels/admin/useSeasonEditorViewModel";

type SeasonVm = ReturnType<typeof useSeasonEditorViewModel>;

function ModeDays({ mode, effect }: { mode: DayMode; effect: BossEffect | null }) {
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
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-heading font-semibold whitespace-nowrap">
                {t("common:day", { number: row.number })}{" "}
                <span className="text-xs text-muted-foreground">{t(`common:weekdays.${row.weekday}`)}</span>
              </span>
              {/* Efeito da temporada: vem do cartão acima e vale para todos os dias do modo. */}
              {effect && <BossEffectBadge effect={effect} season className="mr-auto" />}
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
                          <AttributeLabel value={v} />
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

/** Temporada atual: escolhe o efeito que atordoa o chefe na BAX e na BAL (todos os dias do modo). */
function SeasonCard({ vm }: { vm: SeasonVm }) {
  const { t } = useTranslation(["admin", "common"]);
  return (
    <section className={cn("flex flex-col gap-3 rounded-xl p-3 ring-1 ring-foreground/10", vm.dirty && "bg-energy/5 ring-energy/50")}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="font-heading font-semibold">{t("admin:days.season.title")}</h2>
          <p className="text-xs text-muted-foreground">{t("admin:days.season.help")}</p>
        </div>
        <span className="flex items-center gap-1">
          <Button size="icon-sm" variant="ghost" disabled={!vm.dirty} onClick={vm.reset} aria-label={t("admin:common.cancel")}>
            <RotateCcwIcon />
          </Button>
          <Button size="sm" disabled={!vm.dirty || vm.isSaving} onClick={vm.save}>
            <SaveIcon data-icon="inline-start" />
            {t("admin:common.save")}
          </Button>
        </span>
      </div>
      <QueryState isLoading={vm.isLoading} isError={vm.isError} retry={vm.retry}>
        <div className="grid gap-2 sm:grid-cols-2">
          {DAY_MODES.map((mode) => (
            <label key={mode} className="flex min-w-0 flex-col gap-1">
              <span className="text-xs text-muted-foreground">{t("admin:days.season.effectOf", { mode })}</span>
              <Select value={vm.season?.[mode]} onValueChange={(v) => vm.setEffect(mode, v as BossEffect)}>
                <SelectTrigger className="w-full" aria-label={t("admin:days.season.effectOf", { mode })}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EFFECTS_BY_MODE[mode].map((e) => (
                    <SelectItem key={e} value={e}>
                      <BossEffectIcon effect={e} />
                      {t(`common:effects.${e}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
          ))}
        </div>
      </QueryState>
    </section>
  );
}

export function RestrictionEditorView() {
  const { t } = useTranslation("admin");
  const season = useSeasonEditorViewModel({ saved: t("common.saved"), error: t("common.error") });
  return (
    <div className="flex flex-col gap-4">
      <SeasonCard vm={season} />
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
            <ModeDays mode={m} effect={season.savedEffectOf(m)} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
