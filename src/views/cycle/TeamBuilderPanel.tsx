import { useState } from "react";
import Link from "next/link";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useTranslation } from "next-i18next/pages";
import { CopyIcon, SparklesIcon, UnlockIcon, XIcon, ZapIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { ctpColor, ctpTintStyle } from "@/models/domain/ctpColors";
import { DISPLAY_SLOTS, type Slot } from "@/models/domain/enums";
import type { Criterion, MetaTeam, PriorityLists } from "@/models/domain/types";
import type { CtpStatus, SlotStatus } from "@/models/rules/compare";
import type { TeamKey } from "@/models/schemas/selections";
import { useExportImageViewModel } from "@/viewmodels/useExportImageViewModel";
import { useTeamBuilderViewModel, type TeamBuilderViewModel } from "@/viewmodels/useTeamBuilderViewModel";
import { CtpPalette } from "@/views/day/CtpPalette";
import { CtpBadge } from "@/views/shared/CtpBadge";
import { CtpDragOverlay } from "@/views/shared/CtpDragOverlay";
import { CtpPicker } from "@/views/shared/CtpPicker";
import { CtpSlotSwitch } from "@/views/shared/CtpSlotSwitch";
import { ExportImageButton } from "@/views/shared/ExportImageButton";
import { LoadingState } from "@/views/shared/LoadingState";
import { MemberChip } from "@/views/shared/MemberChip";
import { UniformPicker } from "@/views/shared/UniformPicker";

const STATUS_VARIANT: Record<SlotStatus, "brazil" | "antihero" | "villain"> = {
  MATCH: "brazil",
  DIFFERENT: "antihero",
  NOT_OWNED: "villain",
  UNIFORM_NOT_OWNED: "villain",
};
const CTP_VARIANT: Record<CtpStatus, "brazil" | "antihero" | "outline"> = { MATCH: "brazil", CTP_DIFFERENT: "antihero", NONE: "outline" };

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

/** Uma posição da equipe em linha larga: retrato + informações + seletor. Alvo de CTP. */
function SlotRow({
  vm,
  slot,
  dragging,
}: {
  vm: TeamBuilderViewModel;
  slot: TeamBuilderViewModel["slots"][number];
  /** Há um CTP sendo arrastado: realça os alvos válidos. */
  dragging: boolean;
}) {
  const { t } = useTranslation(["days", "common"]);
  const { setNodeRef, isOver } = useDroppable({ id: `slot:${slot.slot}`, disabled: !slot.pick });
  const canReceive = !!slot.pick && (!!vm.armedCtp || dragging);
  const ref = slot.ref;
  const slotLabel = t(`common:team.slots.${slot.slot}`);

  return (
    <li
      ref={setNodeRef}
      onClick={() => vm.tapSlot(slot.slot)}
      style={ctpTintStyle(ctpColor(slot.ctp))}
      className={cn(
        "grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 rounded-lg border border-energy/15 bg-background/40 p-3 transition-[transform,box-shadow,background-color] duration-200",
        slot.slot === "SOLO" && "border-energy/40 bg-energy/5 shadow-[0_0_14px_-4px_var(--glow)]",
        canReceive && "cursor-copy ring-2 ring-energy/70 motion-safe:animate-pulse",
        isOver && "scale-[1.02] bg-energy/15 ring-4 ring-energy motion-safe:animate-none",
      )}
    >
      <div className="relative">
        <Avatar
          className={cn(
            "chamfer-sm size-16 rounded-none ring-2 after:hidden sm:size-20",
            ref?.uniform.side === "HERO" ? "ring-hero/70" : ref?.uniform.side === "VILLAIN" ? "ring-villain/70" : "ring-border",
          )}
        >
          {ref && <AvatarImage src={ref.uniform.portrait || undefined} alt={ref.agent.name} className="rounded-none" />}
          <AvatarFallback className="rounded-none bg-secondary font-heading">{ref ? initials(ref.agent.name) : "?"}</AvatarFallback>
        </Avatar>
        {slot.ctp && (
          <CtpBadge
            key={slot.ctp.id}
            ctp={slot.ctp}
            size="sm"
            className="absolute -right-2 -bottom-2 motion-safe:animate-in motion-safe:zoom-in-50 motion-safe:fade-in motion-safe:duration-300"
          />
        )}
      </div>

      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex flex-wrap items-baseline justify-between gap-x-2">
          <span className="font-heading text-xs tracking-widest text-energy uppercase">{slotLabel}</span>
          {slot.metaRef && (
            <span className="truncate text-xs text-muted-foreground">
              {t("days:myTeam.metaWas", { name: slot.metaRef.agent.name })}
            </span>
          )}
        </div>
        {ref ? (
          <div className="min-w-0">
            <p className="truncate font-heading text-base font-semibold">{ref.agent.name}</p>
            <p className="truncate text-xs text-muted-foreground">{ref.uniform.name}</p>
          </div>
        ) : null}
        <div onClick={(e) => e.stopPropagation()}>
          <UniformPicker
            options={vm.candidates}
            value={null}
            onChange={(uniformId) => vm.setSlot(slot.slot, uniformId)}
            placeholder={slot.pick ? t("days:myTeam.change") : t("days:myTeam.pick")}
            searchPlaceholder={t("days:myTeam.search")}
            emptyText={t("days:myTeam.noCandidates")}
            ariaLabel={slotLabel}
            disabled={!!vm.armedCtp && !!slot.pick}
          />
        </div>
        {slot.pick && ref && (
          // CTP 1 ou 2 do personagem neste dia; trocar o CTP muda o do slot (vale em todos os dias dele).
          <div className="flex flex-col gap-1.5" onClick={(e) => e.stopPropagation()}>
            <CtpSlotSwitch ctp1={slot.ctp1} ctp2={slot.ctp2} value={slot.ctpSlot} onChange={(s) => vm.chooseCtpSlot(slot.slot, s)} />
            <CtpPicker
              ctps={vm.catalog.ctps.filter((c) => c.active)}
              value={slot.ctp?.id ?? null}
              onChange={(id) => (id ? vm.dropCtp(slot.slot, id) : vm.removeCtp(slot.slot))}
              targetName={ref.agent.name}
            >
              <button
                type="button"
                className="flex min-h-11 w-full min-w-0 items-center gap-2 rounded-md border border-dashed border-energy/40 px-2 py-1 text-left text-xs transition-colors hover:bg-energy/10 active:bg-energy/15"
              >
                {slot.ctp ? (
                  <>
                    <CtpBadge ctp={slot.ctp} size="sm" />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate">
                        {t(`common:ctp.${slot.ctp.type}`)} · {t(`common:quality.${slot.ctp.quality}`)}
                      </span>
                      {/* CTP do slot do personagem ou, em equipe antiga, escolhido só para este dia. */}
                      <span className="truncate text-[0.65rem] text-muted-foreground">
                        {slot.ctpSlot ? t("days:myTeam.dayCtp.slot", { n: slot.ctpSlot }) : t("days:myTeam.dayCtp.legacy")}
                      </span>
                    </span>
                    <span className="shrink-0 text-energy">{t("common:ctpPicker.change")}</span>
                  </>
                ) : (
                  <>
                    <ZapIcon className="size-4 shrink-0 text-energy" />
                    <span className="min-w-0 flex-1 truncate font-medium text-energy">{t("common:ctpPicker.choose")}</span>
                  </>
                )}
              </button>
            </CtpPicker>
          </div>
        )}
        {slot.pick && ref && (
          // Striker (apoio da Transcendência 4) que o jogador usa com este personagem.
          <div className="flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
            <span className="flex flex-wrap items-center justify-between gap-x-2 text-xs">
              <span className="flex items-center gap-1 font-medium text-spark">
                <ZapIcon className="size-3.5" />
                {t("days:myTeam.striker.label")}
              </span>
              {slot.metaStriker && slot.metaStriker.uniform.id !== slot.striker?.uniform.id && (
                <span className="truncate text-muted-foreground">
                  {t("days:myTeam.striker.metaWas", { name: slot.metaStriker.agent.name })}
                </span>
              )}
            </span>
            <div className="flex items-center gap-1">
              <div className="min-w-0 flex-1">
                <UniformPicker
                  options={vm.strikerOptions(slot.slot)}
                  value={slot.striker}
                  onChange={(uniformId) => vm.setStriker(slot.slot, uniformId)}
                  placeholder={t("days:myTeam.striker.pick")}
                  searchPlaceholder={t("days:myTeam.search")}
                  emptyText={t("days:myTeam.striker.none")}
                  ariaLabel={`${t("days:myTeam.striker.label")} · ${ref.agent.name}`}
                  disabled={!!vm.armedCtp}
                />
              </div>
              {slot.striker && (
                <Button type="button" size="icon-sm" variant="ghost" onClick={() => vm.setStriker(slot.slot, null)} aria-label={t("days:myTeam.striker.remove")}>
                  <XIcon />
                </Button>
              )}
            </div>
          </div>
        )}
        {(slot.comparison || slot.pick) && (
          <div className="flex flex-wrap items-center gap-1">
            {slot.comparison && (
              <Badge variant={STATUS_VARIANT[slot.comparison.status]} className="h-auto whitespace-normal">
                {t(`days:myTeam.status.${slot.comparison.status}`)}
              </Badge>
            )}
            {slot.pick && slot.comparison && slot.comparison.ctp !== "NONE" && (
              <Badge variant={CTP_VARIANT[slot.comparison.ctp]} className="h-auto whitespace-normal">
                {t(`days:myTeam.ctpStatus.${slot.comparison.ctp}`)}
              </Badge>
            )}
            {slot.pick && (
              <span className="ml-auto flex gap-1">
                {slot.ctp && (slot.ctpSlot === 1 || (slot.ctpSlot === 2 && slot.ctp2)) && (
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      vm.removeCtp(slot.slot);
                    }}
                  >
                    <XIcon data-icon="inline-start" />
                    {t("days:myTeam.palette.remove")}
                  </Button>
                )}
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    vm.clearSlot(slot.slot);
                  }}
                >
                  {t("days:myTeam.clear")}
                </Button>
              </span>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

/** Montagem da equipe do usuário para um dia (ou BAI): elenco, CTPs equipados, Meta e sugestão. */
export function TeamBuilderPanel(props: { teamKey: TeamKey; criteria: Criterion[]; metaTeams: MetaTeam[]; priority: PriorityLists }) {
  const { t } = useTranslation(["days", "common"]);
  const vm = useTeamBuilderViewModel(props);
  const [draggingCtp, setDraggingCtp] = useState<string | null>(null);
  const { ref: exportRef, exportPng, isExporting } = useExportImageViewModel(`minha-equipe-${props.teamKey}`);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
    useSensor(KeyboardSensor),
  );

  const ctpName = (id: unknown) => {
    const ctp = vm.catalog.ctpById(String(id).split(":")[1]);
    return ctp ? `${t(`common:ctp.${ctp.type}`)} ${t(`common:quality.${ctp.quality}`)}` : "";
  };
  const slotName = (id: unknown) => t(`common:team.slots.${String(id).replace("slot:", "")}`);
  const announcements: Announcements = {
    onDragStart: ({ active }) => t("days:myTeam.dnd.pickup", { name: ctpName(active.id) }),
    onDragOver: ({ over }) => (over ? t("days:myTeam.dnd.over", { target: slotName(over.id) }) : t("days:myTeam.dnd.overNone")),
    onDragEnd: ({ active, over }) =>
      over
        ? t("days:myTeam.dnd.drop", { name: ctpName(active.id), target: slotName(over.id) })
        : t("days:myTeam.dnd.dropNone", { name: ctpName(active.id) }),
    onDragCancel: () => t("days:myTeam.dnd.cancel"),
  };
  const onDragStart = ({ active }: DragStartEvent) => setDraggingCtp(String(active.data.current?.ctpId ?? ""));
  // Soltar fora de um personagem não altera nada.
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setDraggingCtp(null);
    if (!over) return;
    vm.dropCtp(String(over.id).replace("slot:", "") as Slot, String(active.data.current?.ctpId ?? ""));
  };

  if (!vm.hydrated || vm.catalog.isLoading) {
    return (
      <LoadingState>
        <Skeleton className="h-64 w-full" />
      </LoadingState>
    );
  }

  const copy = (index: number) => {
    const n = vm.copyTeam(vm.metaTeams[index]);
    toast[n ? "success" : "warning"](n ? t("days:myTeam.copied", { count: n }) : t("days:myTeam.copyNone"));
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setDraggingCtp(null)}
      accessibility={{ announcements, screenReaderInstructions: { draggable: t("days:myTeam.dnd.instructions") } }}
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem]">
        {/* Equipe */}
        <div className="flex min-w-0 flex-col gap-4">
          {/* Escolha livre: para quem não quer preencher o elenco; a restrição do dia continua valendo. */}
          <label
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-lg border p-3",
              vm.freePick ? "border-spark/50 bg-spark/5" : "border-border",
            )}
          >
            <Switch checked={vm.freePick} onCheckedChange={vm.setFreePick} className="mt-0.5" />
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="flex items-center gap-1.5 text-sm font-medium">
                <UnlockIcon className="size-3.5 text-spark" />
                {t("days:myTeam.freePick.label")}
              </span>
              <span className="text-xs text-muted-foreground">{t("days:myTeam.freePick.help")}</span>
            </span>
          </label>

          {!vm.freePick && (!vm.hasRoster || vm.candidates.length === 0) && (
            <Alert>
              <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
                {t("days:myTeam.noCandidates")}
                <span className="flex flex-wrap gap-2">
                  <Button size="sm" variant="energy" onClick={() => vm.setFreePick(true)}>
                    <UnlockIcon data-icon="inline-start" />
                    {t("days:myTeam.freePick.enable")}
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/meu-elenco">{t("days:myTeam.goRoster")}</Link>
                  </Button>
                </span>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {vm.metaTeams.map((team, i) => (
              <Button key={team.id} size="sm" variant="outline" onClick={() => copy(i)}>
                <CopyIcon data-icon="inline-start" />
                {team.isPrimary ? t("days:myTeam.copyMeta") : t("days:myTeam.copyAlt")}
              </Button>
            ))}
            {vm.suggestion && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  vm.applySuggestion();
                  toast.success(t("days:myTeam.suggestion.applied"));
                }}
              >
                <SparklesIcon data-icon="inline-start" className="text-spark" />
                {t("days:myTeam.suggestion.apply")}
              </Button>
            )}
            <span className="ml-auto">
              <ExportImageButton onExport={exportPng} disabled={isExporting} />
            </span>
          </div>

          {vm.armedCtp && (
            <Alert className="border-energy/40 bg-energy/10">
              <ZapIcon className="text-energy" />
              <AlertDescription>{t("days:myTeam.palette.armed")}</AlertDescription>
            </Alert>
          )}

          <div ref={exportRef} className="rounded-xl bg-card">
            <ul className="flex flex-col gap-2">
              {vm.slots.map((slot) => (
                <SlotRow key={slot.slot} vm={vm} slot={slot} dragging={!!draggingCtp} />
              ))}
            </ul>
          </div>
          <p className="text-xs text-muted-foreground">{t("days:myTeam.help.text1")}</p>
        </div>

        {/* CTPs e sugestão: coluna lateral no notebook/PC */}
        <aside className="hidden min-w-0 flex-col gap-4 lg:flex">
          <Card size="sm">
            <CardHeader>
              <CardTitle>{t("days:myTeam.palette.title")}</CardTitle>
              <CardDescription>{t("days:myTeam.palette.hint")}</CardDescription>
            </CardHeader>
            <CardContent>
              <CtpPalette ctps={vm.catalog.ctps.filter((ctp) => ctp.active)} armedCtp={vm.armedCtp} onArm={vm.armCtp} idPrefix="ctp-aside" />
            </CardContent>
          </Card>
          {vm.suggestion && (
            <Card size="sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SparklesIcon className="size-4 text-spark" />
                  {t("days:myTeam.suggestion.title")}
                </CardTitle>
                <CardDescription>{t("days:myTeam.suggestion.text")}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="grid grid-cols-3 gap-1.5">
                  {DISPLAY_SLOTS.map((s) => {
                    const pick = vm.suggestion?.[s];
                    const sref = pick ? vm.catalog.uniformById(pick.uniformId) : null;
                    return (
                      <li key={s} className="min-w-0">
                        <MemberChip refItem={sref} ctp={null} slotLabel={t(`common:team.slots.${s}`)} leader={s === "SOLO"} />
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          )}
        </aside>
      </div>

      <CtpDragOverlay ctp={vm.catalog.ctpById(draggingCtp)} />

    </DndContext>
  );
}
