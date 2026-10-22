import { useState } from "react";
import { useTranslation } from "next-i18next/pages";
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { DAY_MODES, type DayMode } from "@/models/domain/enums";
import type { CycleModeDay } from "@/models/domain/types";
import type { MetaScopeViewModel } from "@/viewmodels/admin/useMetaScopeViewModel";
import type { useMetaTeamEditorViewModel } from "@/viewmodels/admin/useMetaTeamEditorViewModel";
import { QueryState } from "@/views/shared/QueryState";
import { RestrictionBadges } from "@/views/shared/RestrictionBadges";
import { TeamStrip } from "@/views/shared/TeamStrip";
import { Badge } from "@/components/ui/badge";
import { MODE_VISUALS } from "@/views/shared/modeVisuals";
import { ReservesEditor } from "./ReservesEditor";

type EditorVm = ReturnType<typeof useMetaTeamEditorViewModel>;
type ModeFilter = DayMode | "BOTH";

function TeamActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const { t } = useTranslation("admin");
  return (
    <div className="flex items-center">
      <Button size="icon-sm" variant="ghost" onClick={onEdit} aria-label={t("common.edit")}>
        <PencilIcon />
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button size="icon-sm" variant="ghost" aria-label={t("common.delete")}>
            <Trash2Icon className="text-destructive" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("common.delete")}</AlertDialogTitle>
            <AlertDialogDescription>{t("metas.deleteConfirm")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={onDelete}>
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/** Um modo (BAX ou BAL) de um dia: restrição, Meta e Alternativas, com ações no próprio lugar. */
function ModeCell({
  mode,
  day,
  data,
  scopeVm,
  vm,
}: {
  mode: DayMode;
  day: number;
  data: CycleModeDay | null;
  scopeVm: MetaScopeViewModel;
  vm: EditorVm;
}) {
  const { t } = useTranslation(["admin", "common"]);
  const teams = data?.metaTeams ?? [];
  const hasPrimary = teams.some((tm) => tm.isPrimary);
  // Aponta o escopo para o dia antes de abrir: o editor usa a restrição e o alvo dele.
  const open = (fn: () => void) => {
    scopeVm.select(mode, day);
    fn();
  };

  return (
    <div className={cn("flex min-w-0 flex-col gap-2 rounded-md border-t-2 p-2", MODE_VISUALS[mode].accentBar, MODE_VISUALS[mode].tint)}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={MODE_VISUALS[mode].badge} className="font-heading">
          {mode}
        </Badge>
        <RestrictionBadges criteria={data?.criteria ?? []} />
      </div>
      {teams.map((team) => (
        <TeamStrip
          key={team.id}
          label={team.isPrimary ? t("common:team.primary") : (team.label ?? t("common:team.alternative"))}
          tone={team.isPrimary ? "meta" : "alt"}
          members={team.members}
          catalog={scopeVm.catalog}
          action={
            <TeamActions onEdit={() => open(() => vm.startEdit(team))} onDelete={() => vm.remove(team.id)} />
          }
        />
      ))}
      <div className="flex flex-wrap gap-1.5">
        {!hasPrimary && (
          <Button size="sm" variant="energy" onClick={() => open(() => vm.startNew(true))}>
            <PlusIcon data-icon="inline-start" />
            {t("admin:metas.addMeta")}
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={() => open(() => vm.startNew(false))}>
          <PlusIcon data-icon="inline-start" />
          {t("admin:metas.addAlt")}
        </Button>
      </div>
      {data && (
        <ReservesEditor
          target={{ scope: "DAY", mode, number: day }}
          saved={data.reserves}
          options={scopeVm.optionsFor(data.criteria)}
          catalog={scopeVm.catalog}
        />
      )}
    </div>
  );
}

/**
 * Quadro do ciclo: todos os dias de BAX/BAL com as equipes lado a lado, para editar sem trocar
 * de dia e de modo a cada passo. Filtros por semana e por modo encurtam a lista no celular.
 */
export function MetaCycleBoard({ scopeVm, vm }: { scopeVm: MetaScopeViewModel; vm: EditorVm }) {
  const { t } = useTranslation(["admin", "common"]);
  const [week, setWeek] = useState("all");
  const [modeFilter, setModeFilter] = useState<ModeFilter>("BOTH");
  const modes = modeFilter === "BOTH" ? DAY_MODES : [modeFilter];
  const days = (scopeVm.cycle.data?.days ?? []).filter((d) => !d.isBai && (week === "all" || String(d.week) === week));

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">{t("admin:metas.boardHint")}</p>
      <div className="sticky top-16 z-20 -mx-4 flex flex-wrap items-center gap-2 border-b border-energy/15 bg-background/95 px-4 py-2">
        <ToggleGroup type="single" size="sm" variant="outline" value={week} onValueChange={(v) => v && setWeek(v)} className="max-w-full overflow-x-auto">
          <ToggleGroupItem value="all">{t("admin:metas.allWeeks")}</ToggleGroupItem>
          {[1, 2, 3, 4].map((n) => (
            <ToggleGroupItem key={n} value={String(n)}>
              {t("admin:metas.week", { n })}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <ToggleGroup
          type="single"
          size="sm"
          variant="outline"
          className="max-w-full overflow-x-auto"
          value={modeFilter}
          onValueChange={(v) => v && setModeFilter(v as ModeFilter)}
        >
          <ToggleGroupItem value="BOTH">{t("admin:metas.bothModes")}</ToggleGroupItem>
          {DAY_MODES.map((m) => (
            <ToggleGroupItem key={m} value={m}>
              {m}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <QueryState isLoading={scopeVm.isLoading} isError={scopeVm.cycle.isError} retry={scopeVm.cycle.refetch}>
        <ul className="flex flex-col gap-3">
          {days.map((d) => (
            <li key={d.number} className="rounded-xl bg-card/60 p-3 ring-1 ring-foreground/10">
              <p className="mb-2 font-heading font-semibold">
                {t("common:day", { number: d.number })}{" "}
                <span className="text-xs text-muted-foreground">{t(`common:weekdays.${d.weekday}`)}</span>
              </p>
              <div className={cn("grid gap-4 *:min-w-0", modes.length === 2 && "md:grid-cols-2 md:divide-x md:divide-foreground/10")}>
                {modes.map((m, i) => (
                  <div key={m} className={cn(i > 0 && "border-t border-foreground/10 pt-3 md:border-t-0 md:pt-0 md:pl-4")}>
                    <ModeCell
                      mode={m}
                      day={d.number}
                      data={m === "BAX" ? d.bax : d.bal}
                      scopeVm={scopeVm}
                      vm={vm}
                    />
                  </div>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </QueryState>
    </div>
  );
}
