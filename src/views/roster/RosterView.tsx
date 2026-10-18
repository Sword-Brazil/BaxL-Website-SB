import { useState } from "react";
import { DndContext, KeyboardSensor, PointerSensor, TouchSensor, useDroppable, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { useTranslation } from "next-i18next/pages";
import { CheckIcon, DownloadIcon, SearchIcon, UploadIcon, XIcon, ZapIcon } from "lucide-react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { CRITERION_ATTRIBUTES, CRITERION_VALUES, MODES } from "@/models/domain/enums";
import { ctpColor } from "@/models/domain/ctpColors";
import type { Agent } from "@/models/domain/types";
import { useRosterViewModel } from "@/viewmodels/useRosterViewModel";
import { CtpPalette } from "@/views/day/CtpPalette";
import { CtpBadge } from "@/views/shared/CtpBadge";
import { CtpDragOverlay } from "@/views/shared/CtpDragOverlay";
import { HelpHint } from "@/views/layout/HelpHint";
import { QueryState } from "@/views/shared/QueryState";

type RosterVm = ReturnType<typeof useRosterViewModel>;

/** Cartão do agente: uniformes possuídos e o CTP equipado (alvo de arrastar e soltar). */
function AgentRosterCard({ agent, vm, dragging }: { agent: Agent; vm: RosterVm; dragging: boolean }) {
  const { t } = useTranslation(["roster", "common", "days"]);
  const activeUniforms = vm.visibleUniforms(agent);
  const ownedCount = activeUniforms.filter((u) => vm.isOwned(u.id)).length;
  const isOwned = ownedCount > 0;
  const ctp = vm.equippedCtpOf(agent.id);
  const { setNodeRef, isOver } = useDroppable({ id: `agent:${agent.id}`, disabled: !isOwned });
  return (
    <li
      ref={setNodeRef}
      className={cn("min-w-0", ctp && "roster-ctp-neon")}
      style={ctp ? ({ "--ctp-neon": ctpColor(ctp) } as React.CSSProperties) : undefined}
    >
      <Card
        size="sm"
        variant={isOwned ? "panel" : "default"}
        // A sombra fica no <li>, fora do Card que usa overflow-hidden.
        style={ctp ? ({ borderColor: ctpColor(ctp), backgroundColor: `color-mix(in oklch, ${ctpColor(ctp)} 10%, transparent)` } as React.CSSProperties) : undefined}
        className={cn(
          "h-full border transition-[transform,box-shadow,background-color] duration-200",
          ctp && "roster-ctp-card",
          isOwned && (vm.armedCtp || dragging) && "cursor-copy ring-2 ring-energy/70 motion-safe:animate-pulse",
          isOver && "scale-[1.02] bg-energy/15 ring-4 ring-energy motion-safe:animate-none",
        )}
        onClick={() => vm.tapAgent(agent.id)}
      >
        <CardHeader>
          <CardTitle className="flex min-w-0 items-center justify-between gap-2">
            <span className="truncate font-heading">{agent.name}</span>
            {agent.side !== "UNKNOWN" && (
              <Badge variant={agent.side === "HERO" ? "hero" : "villain"}>{t(`common:values.${agent.side}`)}</Badge>
            )}
          </CardTitle>
          <CardDescription className="flex min-w-0 flex-wrap items-center justify-between gap-1">
            <span className="truncate">
              {t(`common:values.${agent.species}`)} · {t(`common:values.${agent.attackType}`)}
            </span>
            <Button
              size="xs"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                vm.setAgentOwned(agent.id, ownedCount < activeUniforms.length);
              }}
            >
              {ownedCount < activeUniforms.length ? t("roster:markAgent") : t("roster:unmarkAgent")}
            </Button>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            {activeUniforms.map((u) => {
              const owned = vm.isOwned(u.id);
              return (
                <Toggle
                  key={u.id}
                  pressed={owned}
                  onPressedChange={() => vm.toggle(u.id)}
                  onClick={(e) => e.stopPropagation()}
                  variant="outline"
                  className={cn("h-auto min-h-11 max-w-full gap-2 py-1 pr-3 pl-1", owned && "border-energy/60 bg-energy/10")}
                  aria-label={`${agent.name} — ${u.name}`}
                >
                  <Avatar className="chamfer-sm size-9 shrink-0 rounded-none after:hidden">
                    <AvatarImage src={u.portrait || undefined} alt="" loading="lazy" decoding="async" className={cn("rounded-none", !owned && "grayscale")} />
                    <AvatarFallback className="rounded-none text-xs">{agent.name.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 truncate text-xs">{u.name}</span>
                  {owned && <CheckIcon className="shrink-0 text-energy" />}
                </Toggle>
              );
            })}
          </div>
          {isOwned && (
            <div className="flex min-h-9 items-center justify-between gap-2 rounded-md border border-dashed border-energy/30 px-2 py-1">
              {ctp ? (
                <>
                  <span className="flex min-w-0 items-center gap-2 text-xs">
                    <CtpBadge
                      key={ctp.id}
                      ctp={ctp}
                      size="sm"
                      className="motion-safe:animate-in motion-safe:zoom-in-50 motion-safe:fade-in motion-safe:duration-300"
                    />
                    <span className="truncate">
                      {t(`common:ctp.${ctp.type}`)} · {t(`common:quality.${ctp.quality}`)}
                    </span>
                  </span>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label={t("days:myTeam.palette.remove")}
                    onClick={(e) => {
                      e.stopPropagation();
                      vm.equip(agent.id, null);
                    }}
                  >
                    <XIcon />
                  </Button>
                </>
              ) : (
                <span className="text-xs text-muted-foreground">{t("roster:ctpDrop")}</span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </li>
  );
}

export function RosterView() {
  const { t } = useTranslation(["roster", "common"]);
  const vm = useRosterViewModel({
    imported: t("roster:backup.imported"),
    invalid: t("roster:backup.invalid"),
    reset: (mode) => t("roster:reset.done", { mode }),
  });
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
    useSensor(KeyboardSensor),
  );
  const [draggingCtp, setDraggingCtp] = useState<string | null>(null);
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setDraggingCtp(null);
    if (over) vm.equip(String(over.id).replace("agent:", ""), String(active.data.current?.ctpId ?? ""));
  };
  const palette = (idPrefix: string) => (
    <CtpPalette ctps={vm.ctps} armedCtp={vm.armedCtp} onArm={vm.armCtp} idPrefix={idPrefix} />
  );

  return (
    <DndContext
      sensors={sensors}
      onDragStart={({ active }) => setDraggingCtp(String(active.data.current?.ctpId ?? ""))}
      onDragEnd={onDragEnd}
      onDragCancel={() => setDraggingCtp(null)}
      accessibility={{ screenReaderInstructions: { draggable: t("days:myTeam.dnd.instructions") } }}
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-heading text-3xl font-bold">{t("roster:title")}</h1>
            <p className="text-sm text-muted-foreground">{t("roster:subtitle")}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="energy" className="h-7 px-3 text-sm">
              {t("roster:owned", { owned: vm.ownedAgentCount, total: vm.totalAgents })}
            </Badge>
            <HelpHint title={t("roster:help.title")}>
              <p>{t("roster:help.text1")}</p>
              <p>{t("roster:help.text2")}</p>
            </HelpHint>
          </div>
        </div>

        <Card size="sm">
          <CardContent className="flex flex-col gap-3">
            <InputGroup>
              <InputGroupAddon>
                <SearchIcon />
              </InputGroupAddon>
              <InputGroupInput
                placeholder={t("roster:search")}
                value={vm.search}
                onChange={(e) => vm.setSearch(e.target.value)}
                aria-label={t("roster:search")}
              />
            </InputGroup>
            <div className="flex flex-col gap-2">
              {CRITERION_ATTRIBUTES.map((attr) => (
                <div key={attr} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
                  <span className="text-xs text-muted-foreground sm:w-28 sm:shrink-0">{t(`common:attributes.${attr}`)}</span>
                  <ToggleGroup
                    type="single"
                    size="sm"
                    variant="outline"
                    value={vm.filters[attr] ?? ""}
                    onValueChange={(v) => vm.setFilter(attr, v)}
                    className="flex-wrap"
                  >
                    {CRITERION_VALUES[attr].map((v) => (
                      <ToggleGroupItem key={v} value={v}>
                        {t(`common:values.${v}`)}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>
              ))}
            </div>
            {vm.hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="self-start"
                onClick={() => {
                  vm.clearFilters();
                  vm.setSearch("");
                }}
              >
                <XIcon data-icon="inline-start" />
                {t("roster:clearFilters")}
              </Button>
            )}
          </CardContent>
        </Card>

        {vm.armedCtp && (
          <Alert className="sticky top-16 z-30 border-energy/40 bg-background/95">
            <ZapIcon className="text-energy" />
            <AlertDescription>{t("roster:ctpArmed")}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_17rem]">
          <QueryState
            isLoading={vm.isLoading}
            isError={vm.isError}
            retry={vm.retry}
            skeleton={
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }, (_, i) => (
                  <Skeleton key={i} className="h-32" />
                ))}
              </div>
            }
          >
            {vm.agents.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("roster:empty")}</p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {vm.agents.map((agent) => (
                  <AgentRosterCard key={agent.id} agent={agent} vm={vm} dragging={!!draggingCtp} />
                ))}
              </ul>
            )}
          </QueryState>
          <aside className="hidden lg:block">
            <Card size="sm" className="sticky top-20">
              <CardHeader>
                <CardTitle>{t("roster:ctpTitle")}</CardTitle>
                <CardDescription>{t("days:myTeam.palette.hint")}</CardDescription>
              </CardHeader>
              <CardContent>{palette("ctp-aside")}</CardContent>
            </Card>
          </aside>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="energy" size="touch" className="fixed right-4 bottom-4 z-40 shadow-lg lg:hidden">
              <ZapIcon data-icon="inline-start" />
              {t("roster:ctpTitle")}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[70dvh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{t("roster:ctpTitle")}</SheetTitle>
              <SheetDescription>{t("days:myTeam.palette.hint")}</SheetDescription>
            </SheetHeader>
            <div className="px-4 pb-6">{palette("ctp-sheet")}</div>
          </SheetContent>
        </Sheet>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{t("roster:backup.title")}</CardTitle>
              <CardDescription>{t("roster:localNote")}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={vm.exportBackup}>
                <DownloadIcon data-icon="inline-start" />
                {t("roster:backup.export")}
              </Button>
              <Input
                id="backup-file"
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) vm.importBackup(file);
                  e.target.value = "";
                }}
              />
              <Button variant="outline" asChild>
                <label htmlFor="backup-file">
                  <UploadIcon data-icon="inline-start" />
                  {t("roster:backup.import")}
                </label>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t("roster:reset.title")}</CardTitle>
              <CardDescription>{t("roster:reset.text")}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {MODES.map((mode) => (
                <AlertDialog key={mode}>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">{mode}</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t("roster:reset.title")}</AlertDialogTitle>
                      <AlertDialogDescription>{t("roster:reset.confirm", { mode })}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t("common:actions.cancel")}</AlertDialogCancel>
                      <AlertDialogAction variant="destructive" onClick={() => vm.resetMode(mode)}>
                        {t("common:actions.confirm")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ))}
            </CardContent>
          </Card>
        </div>
        <CtpDragOverlay ctp={vm.ctps.find((c) => c.id === draggingCtp) ?? null} />
      </div>
    </DndContext>
  );
}
