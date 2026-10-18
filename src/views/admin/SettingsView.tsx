import { useTranslation } from "next-i18next/pages";
import { SaveIcon, TriangleAlertIcon } from "lucide-react";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import { useSettingsViewModel } from "@/viewmodels/admin/useSettingsViewModel";
import { useBattleClockViewModel } from "@/viewmodels/useBattleClockViewModel";
import { QueryState } from "@/views/shared/QueryState";
import { TextField } from "@/views/shared/FormFields";

export function SettingsView() {
  const { t } = useTranslation(["admin", "days", "common"]);
  const vm = useSettingsViewModel({ saved: t("admin:common.saved") });
  const { clock } = useBattleClockViewModel();
  const rootError = vm.form.formState.errors.root?.message;

  return (
    <QueryState isLoading={vm.isLoading} isError={vm.isError} retry={vm.retry}>
      <Card variant="panel" className="max-w-xl">
        <form onSubmit={vm.submit} noValidate>
          <CardContent>
            <FieldGroup>
              {rootError && (
                <Alert variant="destructive">
                  <TriangleAlertIcon />
                  <AlertTitle>{rootError}</AlertTitle>
                </Alert>
              )}
              {clock && (
                <p className="font-heading text-energy">
                  {t("days:today.currentDay")}: {t("days:today.dayOfCycle", { day: clock.cycleDay, weekday: t(`common:weekdays.${clock.weekday}`) })}
                </p>
              )}
              <TextField
                control={vm.form.control}
                name="anchorLocal"
                label={t("admin:settings.anchor")}
                description={t("admin:settings.anchorHelp")}
                type="datetime-local"
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField control={vm.form.control} name="dayTurnoverHour" label={t("admin:settings.turnover")} type="number" min={0} max={23} />
                <TextField control={vm.form.control} name="weeklyResetHour" label={t("admin:settings.reset")} type="number" min={0} max={23} />
              </div>
            </FieldGroup>
          </CardContent>
          <CardFooter className="mt-4 justify-end">
            <Button type="submit" variant="energy" disabled={vm.isSaving}>
              <SaveIcon data-icon="inline-start" />
              {vm.isSaving ? t("admin:common.saving") : t("admin:common.save")}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </QueryState>
  );
}
