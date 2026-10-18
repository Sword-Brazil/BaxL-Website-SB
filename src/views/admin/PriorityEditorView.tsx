import { DndContext, KeyboardSensor, PointerSensor, TouchSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { useTranslation } from "next-i18next/pages";
import { ArrowDownIcon, ArrowUpIcon, GripVerticalIcon, SaveIcon, Trash2Icon, TriangleAlertIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PRIORITY_ROLES, type PriorityRole } from "@/models/domain/enums";
import type { MetaScopeViewModel } from "@/viewmodels/admin/useMetaScopeViewModel";
import { usePriorityEditorViewModel } from "@/viewmodels/admin/usePriorityEditorViewModel";
import { AgentPortrait } from "@/views/shared/AgentPortrait";
import { CtpSelect } from "@/views/shared/CtpSelect";
import { QueryState } from "@/views/shared/QueryState";
import { UniformPicker } from "@/views/shared/UniformPicker";

type VM = ReturnType<typeof usePriorityEditorViewModel>;

function Row({ role, index, vm, scopeVm }: { role: PriorityRole; index: number; vm: VM; scopeVm: MetaScopeViewModel }) {
  const { t } = useTranslation("admin");
  const id = `${role}:${index}`;
  const { setNodeRef: setDragRef, listeners, attributes, isDragging } = useDraggable({ id });
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id });
  const item = vm.lists[role][index];
  return (
    <li
      ref={setDropRef}
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-lg border border-energy/10 bg-background/40 p-2",
        isOver && "ring-2 ring-energy",
        isDragging && "opacity-50",
      )}
    >
      <Button
        ref={setDragRef}
        {...listeners}
        {...attributes}
        size="icon-sm"
        variant="ghost"
        className="cursor-grab touch-none"
        aria-label={`${index + 1}`}
      >
        <GripVerticalIcon />
      </Button>
      <span className="w-6 font-heading text-energy">{index + 1}</span>
      <AgentPortrait refItem={scopeVm.catalog.uniformById(item.uniformId)} size="sm" className="min-w-40 flex-1" />
      <div className="w-48">
        <CtpSelect
          ctps={scopeVm.catalog.ctps}
          value={item.ctpId}
          onChange={(ctpId) => vm.setCtp(role, index, ctpId)}
          allowNone
          placeholder="CTP"
        />
      </div>
      <div className="flex">
        <Button size="icon-sm" variant="ghost" onClick={() => vm.move(role, index, index - 1)} aria-label={t("common.moveUp")}>
          <ArrowUpIcon />
        </Button>
        <Button size="icon-sm" variant="ghost" onClick={() => vm.move(role, index, index + 1)} aria-label={t("common.moveDown")}>
          <ArrowDownIcon />
        </Button>
        <Button size="icon-sm" variant="ghost" onClick={() => vm.remove(role, index)} aria-label={t("common.remove")}>
          <Trash2Icon className="text-destructive" />
        </Button>
      </div>
    </li>
  );
}

export function PriorityEditorView({ scopeVm }: { scopeVm: MetaScopeViewModel }) {
  const { t } = useTranslation(["admin", "common"]);
  const vm = usePriorityEditorViewModel(scopeVm, { saved: t("admin:common.saved") });
  const sensors = useSensors(useSensor(PointerSensor), useSensor(TouchSensor), useSensor(KeyboardSensor));

  if (!vm.enabled) return <p className="text-sm text-muted-foreground">{t("admin:priority.subtitle")}</p>;

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over) return;
    const [role, from] = String(active.id).split(":");
    const [overRole, to] = String(over.id).split(":");
    if (role === overRole) vm.move(role as PriorityRole, Number(from), Number(to));
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        {t("admin:priority.subtitle")} {t("admin:priority.help")}
      </p>
      {vm.error && (
        <Alert variant="destructive">
          <TriangleAlertIcon />
          <AlertTitle>{vm.error}</AlertTitle>
        </Alert>
      )}
      <QueryState isLoading={vm.isLoading} isError={vm.isError} retry={vm.retry}>
        <DndContext sensors={sensors} onDragEnd={onDragEnd}>
          <div className="grid gap-4 lg:grid-cols-2">
            {PRIORITY_ROLES.map((role) => (
              <Card key={role} variant="panel">
                <CardHeader>
                  <CardTitle className="tracking-wider text-energy uppercase">
                    {role === "SOLO" ? t("admin:priority.solo") : t("admin:priority.support")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  {vm.lists[role].length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t("admin:priority.empty")}</p>
                  ) : (
                    <ol className="flex flex-col gap-2">
                      {vm.lists[role].map((item, i) => (
                        <Row key={`${item.uniformId}`} role={role} index={i} vm={vm} scopeVm={scopeVm} />
                      ))}
                    </ol>
                  )}
                  <UniformPicker
                    options={scopeVm.options.filter((o) => !vm.lists[role].some((i) => i.uniformId === o.uniform.id))}
                    value={null}
                    onChange={(uniformId) => vm.add(role, uniformId)}
                    placeholder={`+ ${t("admin:common.add")}`}
                    searchPlaceholder={t("admin:metas.searchAgent")}
                    emptyText={t("admin:metas.noAgent")}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </DndContext>
        <div className="flex justify-end">
          <Button variant="energy" disabled={!vm.dirty || vm.isSaving} onClick={vm.save}>
            <SaveIcon data-icon="inline-start" />
            {vm.isSaving ? t("admin:common.saving") : t("admin:common.save")}
          </Button>
        </div>
      </QueryState>
    </div>
  );
}
