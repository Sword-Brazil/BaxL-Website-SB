import type * as React from "react";
import Link from "next/link";
import { useTranslation } from "next-i18next/pages";
import { ExternalLinkIcon, Link2Icon, PencilIcon, PlusIcon, SwordIcon, Trash2Icon, TriangleAlertIcon, XIcon, ZapIcon } from "lucide-react";
import { Alert, AlertTitle } from "@/components/ui/alert";
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Toggle } from "@/components/ui/toggle";
import { Textarea } from "@/components/ui/textarea";
import { DISPLAY_SLOTS } from "@/models/domain/enums";
import type { Agent } from "@/models/domain/types";
import { hasMetaStrikerTags, metaStrikerOptions } from "@/models/rules/striker";
import type { CatalogViewModel, UniformRef } from "@/viewmodels/useCatalogViewModel";
import type { MetaScopeViewModel } from "@/viewmodels/admin/useMetaScopeViewModel";
import { useMetaTeamEditorViewModel, type MemberDraft } from "@/viewmodels/admin/useMetaTeamEditorViewModel";
import { useRotationsViewModel } from "@/viewmodels/useRotationsViewModel";
import { AlternativesOrder } from "./AlternativesOrder";
import { FreeDaySyncedBadge } from "./FreeDaysSync";
import { MetaCycleBoard } from "./MetaCycleBoard";
import { ReservesEditor } from "./ReservesEditor";
import { TeamStrip } from "@/views/shared/TeamStrip";
import { UpdatedAt } from "@/views/shared/UpdatedAt";
import { CtpSelect } from "@/views/shared/CtpSelect";
import { CtpSlotSwitch } from "@/views/shared/CtpSlotSwitch";
import { EmptyTeam } from "@/views/shared/EmptyTeam";
import { QueryState } from "@/views/shared/QueryState";
import { RestrictionBadges } from "@/views/shared/RestrictionBadges";
import { UniformPicker } from "@/views/shared/UniformPicker";

/** Strikers possíveis para um Causador de Dano: trajes ativos dos outros personagens marcados como Striker meta. */
const strikerOptions = (catalog: CatalogViewModel, agentId: string | undefined): UniformRef[] =>
  metaStrikerOptions(
    catalog.agents
      .filter((a) => a.active && a.id !== agentId)
      .flatMap((a) => a.uniforms.filter((u) => u.active).map((uniform) => ({ agent: a, uniform }))),
    hasMetaStrikerTags(catalog.agents),
  );

/** Striker meta do Causador de Dano (apoio da Transcendência 4), com botão para tirar. */
function StrikerPicker({
  catalog,
  agent,
  value,
  onChange,
}: {
  catalog: CatalogViewModel;
  agent: Agent;
  value: string | null;
  onChange: (uniformId: string | null) => void;
}) {
  const { t } = useTranslation("admin");
  return (
    <div className="flex flex-col gap-1">
      <span className="flex items-center gap-1 text-xs font-medium text-spark">
        <ZapIcon className="size-3.5" />
        {t("metas.striker", { name: agent.name })}
      </span>
      <div className="flex items-center gap-1">
        <div className="min-w-0 flex-1">
          <UniformPicker
            options={strikerOptions(catalog, agent.id)}
            value={value ? catalog.uniformById(value) : null}
            onChange={onChange}
            placeholder={t("metas.pickStriker")}
            searchPlaceholder={t("metas.searchAgent")}
            emptyText={t("metas.noAgent")}
            ariaLabel={t("metas.striker", { name: agent.name })}
          />
        </div>
        {value && (
          <Button type="button" size="icon-sm" variant="ghost" onClick={() => onChange(null)} aria-label={t("metas.removeStriker")}>
            <XIcon />
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{t("metas.strikerHelp")}</p>
    </div>
  );
}

/**
 * CTPs 1 e 2 da Meta do personagem (valem em todas as equipes dele) e qual dos dois esta equipe usa.
 */
function MemberCtps({
  catalog,
  member,
  slotLabel,
  onChange,
}: {
  catalog: CatalogViewModel;
  member: MemberDraft;
  slotLabel: string;
  onChange: (patch: Partial<MemberDraft>) => void;
}) {
  const { t } = useTranslation(["admin", "common"]);
  const agentName = member.uniformId ? catalog.uniformById(member.uniformId)?.agent.name : undefined;
  const legacy = member.ctpSlot === null ? catalog.ctpById(member.ctpId) : null;
  return (
    <Field className="sm:col-span-2">
      <FieldLabel>{t("admin:metas.ctps", { name: agentName ?? "" })}</FieldLabel>
      <div className="grid grid-cols-2 gap-2">
        {([1, 2] as const).map((n) => (
          <CtpSelect
            key={n}
            ctps={catalog.ctps}
            value={n === 1 ? member.agentCtp1Id : member.agentCtp2Id}
            onChange={(ctpId) =>
              onChange(
                n === 1
                  ? { agentCtp1Id: ctpId }
                  : // Sem CTP 2, a equipe que usava o 2 volta para o 1.
                    { agentCtp2Id: ctpId, ...(!ctpId && member.ctpSlot === 2 ? { ctpSlot: 1 as const } : {}) },
              )
            }
            placeholder={n === 1 ? t("common:ctpSlot.label", { n }) : t("admin:metas.ctp2Optional")}
            ariaLabel={`${t("common:ctpSlot.label", { n })} · ${slotLabel}`}
            targetName={agentName}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground">{t("common:ctpSlot.use")}</span>
      <CtpSlotSwitch
        ctp1={catalog.ctpById(member.agentCtp1Id)}
        ctp2={catalog.ctpById(member.agentCtp2Id)}
        value={member.ctpSlot}
        onChange={(ctpSlot) => onChange({ ctpSlot })}
      />
      {legacy && (
        <FieldDescription className="text-antihero">
          {t("admin:metas.legacyCtp", { ctp: `${t(`common:ctp.${legacy.type}`)} · ${t(`common:quality.${legacy.quality}`)}` })}
        </FieldDescription>
      )}
      <FieldDescription>{t("admin:metas.ctpsHelp")}</FieldDescription>
    </Field>
  );
}

/** Ligado: o personagem é Causador de Dano nesta equipe, mostra quantas rotações ele já tem e o Striker. */
function DamageDealerToggle({
  pressed,
  onChange,
  agent,
  rotationCount,
  striker,
}: {
  pressed: boolean;
  onChange: (pressed: boolean) => void;
  agent: Agent | null;
  rotationCount: number;
  striker: React.ReactNode;
}) {
  const { t } = useTranslation("admin");
  return (
    <div className="flex flex-col gap-1.5 sm:col-span-2">
      <Toggle
        variant="outline"
        size="sm"
        pressed={pressed}
        onPressedChange={onChange}
        className="self-start data-[state=on]:border-spark data-[state=on]:bg-spark/15 data-[state=on]:text-spark"
      >
        <SwordIcon />
        {t("metas.damageDealer")}
      </Toggle>
      {pressed && agent && (
        <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
          {rotationCount ? t("metas.rotationsCount", { count: rotationCount, name: agent.name }) : t("metas.noRotations", { name: agent.name })}
          <Link href={`/admin/rotacoes?personagem=${agent.slug}`} target="_blank" className="flex items-center gap-1 text-energy hover:underline">
            {rotationCount ? t("metas.manageRotations") : t("metas.addRotations")}
            <ExternalLinkIcon className="size-3" />
          </Link>
        </p>
      )}
      {pressed && agent && striker}
    </div>
  );
}

/** Equipes do escopo. Dias de BAX/BAL: quadro do ciclo inteiro; BAL livre e BAI: lista do escopo. */
export function MetaTeamEditorView({ scopeVm, freeSync = false }: { scopeVm: MetaScopeViewModel; freeSync?: boolean }) {
  const { t } = useTranslation(["admin", "common"]);
  const vm = useMetaTeamEditorViewModel(scopeVm, { saved: t("admin:common.saved"), deleted: t("admin:metas.deleted") });
  const { catalog } = scopeVm;
  const rotations = useRotationsViewModel();

  return (
    <div className="flex flex-col gap-4">
      {scopeVm.isDay ? (
        <MetaCycleBoard scopeVm={scopeVm} vm={vm} freeSync={freeSync} />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {scopeVm.scope === "BAI" && freeSync && (
              <span className="mr-auto">
                <FreeDaySyncedBadge />
              </span>
            )}
            <AlternativesOrder teams={vm.teams} catalog={catalog} onSave={vm.reorder} isSaving={vm.isReordering} />
            <Button variant="energy" onClick={() => vm.startNew()}>
              <PlusIcon data-icon="inline-start" />
              {t("admin:metas.newTeam")}
            </Button>
          </div>

          <QueryState isLoading={vm.isLoading || scopeVm.isLoading} isError={vm.isError} retry={vm.retry}>
            {vm.teams.length === 0 ? (
              <EmptyTeam />
            ) : (
              <div className="grid gap-3 lg:grid-cols-2">
                {vm.teams.map((team) => (
                  <TeamStrip
                    key={team.id}
                    label={team.isPrimary ? t("common:team.primary") : (team.label ?? t("common:team.alternative"))}
                    tone={team.isPrimary ? "meta" : "alt"}
                    members={team.members}
                    catalog={catalog}
                    action={
                      <div className="flex items-center gap-1">
                        <UpdatedAt iso={team.updatedAt} />
                        <Button size="icon-sm" variant="ghost" onClick={() => vm.startEdit(team)} aria-label={t("admin:common.edit")}>
                          <PencilIcon />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon-sm" variant="ghost" aria-label={t("admin:common.delete")}>
                              <Trash2Icon className="text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t("admin:common.delete")}</AlertDialogTitle>
                              <AlertDialogDescription>{t("admin:metas.deleteConfirm")}</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t("admin:common.cancel")}</AlertDialogCancel>
                              <AlertDialogAction variant="destructive" onClick={() => vm.remove(team.id)}>
                                {t("admin:common.delete")}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    }
                  />
                ))}
              </div>
            )}
          </QueryState>
          {scopeVm.scope === "BAI" && scopeVm.cycle.data && (
            <ReservesEditor
              target={{ scope: "BAI" }}
              saved={scopeVm.cycle.data.bai.reserves}
              options={scopeVm.options}
              catalog={catalog}
            />
          )}
        </>
      )}

      <Dialog open={!!vm.draft} onOpenChange={(open) => !open && vm.close()}>
        {/* Celular: tela cheia com rodapé fixo. PC: janela com rolagem interna. */}
        <DialogContent className="top-0 left-0 flex h-dvh max-h-dvh w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none p-0 sm:top-1/2 sm:left-1/2 sm:h-auto sm:max-h-[90dvh] sm:max-w-2xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl">
          <DialogHeader className="shrink-0 gap-1 border-b border-energy/15 px-4 py-3 pr-12 text-left sm:px-6">
            <DialogTitle>
              {vm.draft?.id ? t("admin:metas.editTeam") : t("admin:metas.newTeam")}
              {scopeVm.isDay && ` · ${t("admin:metas.teamOf", { mode: scopeVm.mode, day: scopeVm.number })}`}
            </DialogTitle>
            <DialogDescription>{t("admin:metas.help")}</DialogDescription>
            {scopeVm.isDay && <RestrictionBadges criteria={scopeVm.criteria} />}
            {freeSync && (scopeVm.scope === "BAI" || (scopeVm.isDay && scopeVm.criteria.length === 0)) && (
              <p className="flex items-start gap-1.5 text-xs text-energy">
                <Link2Icon className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                {t("admin:metas.freeSync.dialog")}
              </p>
            )}
          </DialogHeader>
          {vm.draft && (
            <form
              id="meta-team-form"
              className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6"
              onSubmit={(e) => {
                e.preventDefault();
                vm.submit();
              }}
            >
              <FieldGroup>
                {vm.error && (
                  <Alert variant="destructive">
                    <TriangleAlertIcon />
                    <AlertTitle>{vm.error}</AlertTitle>
                  </Alert>
                )}
                {DISPLAY_SLOTS.map((slot) => {
                  const member = vm.draft!.members[slot];
                  return (
                    <div
                      key={slot}
                      className={cn(
                        "grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_14rem]",
                        slot === "SOLO" ? "energy-glow border-energy/40 bg-energy/5" : "border-energy/10",
                        member.isDamageDealer && "border-spark/50",
                      )}
                    >
                      <Field>
                        <FieldLabel className="font-heading tracking-widest text-energy uppercase">
                          {t(`common:team.slots.${slot}`)}
                        </FieldLabel>
                        <UniformPicker
                          options={scopeVm.options}
                          value={member.uniformId ? catalog.uniformById(member.uniformId) : null}
                          onChange={(uniformId) => vm.setMember(slot, { uniformId })}
                          placeholder={t("admin:metas.pickAgent")}
                          searchPlaceholder={t("admin:metas.searchAgent")}
                          emptyText={t("admin:metas.noAgent")}
                          ariaLabel={t(`common:team.slots.${slot}`)}
                        />
                      </Field>
                      {member.uniformId && (
                        <MemberCtps
                          catalog={catalog}
                          member={member}
                          slotLabel={t(`common:team.slots.${slot}`)}
                          onChange={(patch) => vm.setMember(slot, patch)}
                        />
                      )}
                      <DamageDealerToggle
                        pressed={member.isDamageDealer}
                        onChange={(isDamageDealer) => vm.setMember(slot, { isDamageDealer })}
                        agent={member.uniformId ? (catalog.uniformById(member.uniformId)?.agent ?? null) : null}
                        rotationCount={
                          member.uniformId ? rotations.rotationsOf(catalog.uniformById(member.uniformId)?.agent.id ?? "").length : 0
                        }
                        striker={
                          member.uniformId && catalog.uniformById(member.uniformId) ? (
                            <StrikerPicker
                              catalog={catalog}
                              agent={catalog.uniformById(member.uniformId)!.agent}
                              value={member.strikerUniformId}
                              onChange={(strikerUniformId) => vm.setMember(slot, { strikerUniformId })}
                            />
                          ) : null
                        }
                      />
                    </div>
                  );
                })}
                <Field orientation="horizontal">
                  <Switch
                    id="isPrimary"
                    checked={vm.draft.isPrimary}
                    onCheckedChange={(isPrimary) => vm.update({ isPrimary })}
                  />
                  <FieldLabel htmlFor="isPrimary">{t("admin:metas.isPrimary")}</FieldLabel>
                </Field>
                <Field>
                  <FieldLabel htmlFor="label">{t("admin:metas.label")}</FieldLabel>
                  <Input id="label" maxLength={60} value={vm.draft.label} onChange={(e) => vm.update({ label: e.target.value })} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="labelEn">{t("admin:metas.labelEn")}</FieldLabel>
                  <Input
                    id="labelEn"
                    maxLength={60}
                    value={vm.draft.labelEn}
                    placeholder={t("admin:metas.labelEnPlaceholder")}
                    onChange={(e) => vm.update({ labelEn: e.target.value })}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="notes">{t("admin:metas.notes")}</FieldLabel>
                  <Textarea id="notes" maxLength={500} value={vm.draft.notes} onChange={(e) => vm.update({ notes: e.target.value })} />
                </Field>
              </FieldGroup>
            </form>
          )}
          <DialogFooter className="mx-0 mb-0 shrink-0 flex-row justify-end rounded-none border-t border-energy/15 px-4 py-3 sm:px-6">
            <Button variant="outline" onClick={vm.close}>
              {t("admin:common.cancel")}
            </Button>
            <Button type="submit" form="meta-team-form" variant="energy" loading={vm.isSaving}>
              {vm.isSaving ? t("admin:common.saving") : t("admin:common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
