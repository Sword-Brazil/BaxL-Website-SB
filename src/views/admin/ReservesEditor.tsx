import { useState } from "react";
import { useTranslation } from "next-i18next/pages";
import { ArrowDownIcon, ArrowUpIcon, ChevronDownIcon, RotateCcwIcon, SaveIcon, Trash2Icon, TriangleAlertIcon, UsersIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PRIORITY_ROLES } from "@/models/domain/enums";
import type { PriorityLists } from "@/models/domain/types";
import type { PriorityTarget } from "@/models/schemas/admin";
import { useReservesEditorViewModel } from "@/viewmodels/admin/useReservesEditorViewModel";
import type { CatalogViewModel, UniformRef } from "@/viewmodels/useCatalogViewModel";
import { AgentPortrait } from "@/views/shared/AgentPortrait";
import { CtpSelect } from "@/views/shared/CtpSelect";
import { UniformPicker } from "@/views/shared/UniformPicker";

/**
 * Painel recolhido com as reservas de um dia (ou da BAI): Soladores e Suportes extras para a
 * sugestão, depois dos personagens da Meta e das Alternativas.
 */
export function ReservesEditor({
  target,
  saved,
  options,
  catalog,
}: {
  target: PriorityTarget;
  saved: PriorityLists;
  /** Trajes que atendem à restrição do dia. */
  options: UniformRef[];
  catalog: CatalogViewModel;
}) {
  const { t } = useTranslation(["admin", "common"]);
  const vm = useReservesEditorViewModel(target, saved, { saved: t("admin:common.saved") });
  const [open, setOpen] = useState(false);

  return (
    <div className={cn("rounded-md border border-dashed border-foreground/15", vm.dirty && "border-energy/60")}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-10 w-full items-center gap-2 px-2.5 py-1.5 text-left text-sm"
      >
        <UsersIcon className="size-4 shrink-0 text-muted-foreground" />
        <span className="font-medium">{t("admin:metas.reserves")}</span>
        {vm.count > 0 && <Badge variant="outline">{vm.count}</Badge>}
        {vm.dirty && <span className="size-2 rounded-full bg-energy" aria-hidden />}
        <ChevronDownIcon className={cn("ml-auto size-4 shrink-0 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="flex flex-col gap-3 border-t border-foreground/10 p-2.5">
          <p className="text-xs text-muted-foreground">{t("admin:metas.reservesHint")}</p>
          {vm.error && (
            <Alert variant="destructive">
              <TriangleAlertIcon />
              <AlertTitle>{vm.error}</AlertTitle>
            </Alert>
          )}
          {PRIORITY_ROLES.map((role) => (
            <section key={role} className="flex flex-col gap-1.5">
              <h4 className="font-heading text-xs tracking-wider text-energy uppercase">
                {role === "SOLO" ? t("admin:priority.solo") : t("admin:priority.support")}
              </h4>
              {vm.lists[role].length === 0 && <p className="text-xs text-muted-foreground">{t("admin:priority.empty")}</p>}
              <ol className="flex flex-col gap-1.5">
                {vm.lists[role].map((item, i) => {
                  const ref = catalog.uniformById(item.uniformId);
                  return (
                    <li key={item.uniformId} className="flex flex-wrap items-center gap-1.5 rounded-md bg-background/40 p-1.5">
                      <span className="w-4 text-center font-heading text-xs text-energy">{i + 1}</span>
                      <AgentPortrait refItem={ref} size="sm" className="min-w-0 flex-1 basis-32" />
                      <div className="flex">
                        <Button size="icon-sm" variant="ghost" disabled={i === 0} onClick={() => vm.move(role, i, i - 1)} aria-label={t("admin:common.moveUp")}>
                          <ArrowUpIcon />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          disabled={i === vm.lists[role].length - 1}
                          onClick={() => vm.move(role, i, i + 1)}
                          aria-label={t("admin:common.moveDown")}
                        >
                          <ArrowDownIcon />
                        </Button>
                        <Button size="icon-sm" variant="ghost" onClick={() => vm.remove(role, i)} aria-label={t("admin:common.remove")}>
                          <Trash2Icon className="text-destructive" />
                        </Button>
                      </div>
                      <div className="w-full">
                        <CtpSelect
                          ctps={catalog.ctps}
                          value={item.ctpId}
                          onChange={(ctpId) => vm.setCtp(role, i, ctpId)}
                          placeholder="CTP"
                          ariaLabel={`CTP · ${ref?.agent.name ?? i + 1}`}
                          targetName={ref?.agent.name}
                        />
                      </div>
                    </li>
                  );
                })}
              </ol>
              <UniformPicker
                options={options.filter((o) => !vm.lists[role].some((i) => i.uniformId === o.uniform.id))}
                value={null}
                onChange={(uniformId) => vm.add(role, uniformId)}
                placeholder={t("admin:metas.addReserve")}
                searchPlaceholder={t("admin:metas.searchAgent")}
                emptyText={t("admin:metas.noAgent")}
              />
            </section>
          ))}
          {vm.dirty && (
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={vm.reset}>
                <RotateCcwIcon data-icon="inline-start" />
                {t("admin:common.cancel")}
              </Button>
              <Button size="sm" variant="energy" disabled={vm.isSaving} onClick={vm.save}>
                <SaveIcon data-icon="inline-start" />
                {vm.isSaving ? t("admin:common.saving") : t("admin:common.save")}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
