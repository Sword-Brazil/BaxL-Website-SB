import { useTranslation } from "next-i18next/pages";
import { RotateCcwIcon, SaveIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CRITERION_ATTRIBUTES, CRITERION_VALUES, DAY_MODES, type DayMode } from "@/models/domain/enums";
import { ANY, useRestrictionEditorViewModel } from "@/viewmodels/admin/useRestrictionEditorViewModel";
import { QueryState } from "@/views/shared/QueryState";

function ModeTable({ mode }: { mode: DayMode }) {
  const { t } = useTranslation(["admin", "common"]);
  const vm = useRestrictionEditorViewModel(mode, { saved: t("admin:common.saved"), error: t("admin:common.error") });

  return (
    <QueryState isLoading={vm.isLoading} isError={vm.isError} retry={vm.retry}>
      <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("admin:days.day")}</TableHead>
              {CRITERION_ATTRIBUTES.map((a) => (
                <TableHead key={a}>{t(`common:attributes.${a}`)}</TableHead>
              ))}
              <TableHead className="sr-only">{t("admin:common.save")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vm.rows.map((row) => (
              <TableRow key={row.number} data-state={row.dirty ? "selected" : undefined}>
                <TableCell className="font-heading font-semibold whitespace-nowrap">
                  {t("common:day", { number: row.number })}{" "}
                  <span className="text-xs text-muted-foreground">{t(`common:weekdays.${row.weekday}`)}</span>
                </TableCell>
                {CRITERION_ATTRIBUTES.map((a) => (
                  <TableCell key={a}>
                    <Select value={row.draft[a]} onValueChange={(v) => row.setValue(a, v)}>
                      <SelectTrigger className="min-w-36" aria-label={`${t(`common:attributes.${a}`)} · ${row.number}`}>
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
                  </TableCell>
                ))}
                <TableCell className="whitespace-nowrap">
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    disabled={!row.dirty}
                    onClick={row.reset}
                    aria-label={t("admin:common.cancel")}
                  >
                    <RotateCcwIcon />
                  </Button>
                  <Button
                    size="sm"
                    disabled={!row.dirty || vm.savingDay === row.number}
                    onClick={row.save}
                  >
                    <SaveIcon data-icon="inline-start" />
                    {t("admin:common.save")}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </QueryState>
  );
}

export function RestrictionEditorView() {
  return (
    <Tabs defaultValue="BAX">
      <TabsList>
        {DAY_MODES.map((m) => (
          <TabsTrigger key={m} value={m} className="font-heading tracking-wider">
            {m}
          </TabsTrigger>
        ))}
      </TabsList>
      {DAY_MODES.map((m) => (
        <TabsContent key={m} value={m}>
          <ModeTable mode={m} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
