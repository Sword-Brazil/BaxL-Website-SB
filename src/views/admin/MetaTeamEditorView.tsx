import { useTranslation } from "next-i18next/pages";
import { PencilIcon, PlusIcon, SwordIcon, Trash2Icon, TriangleAlertIcon } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { DISPLAY_SLOTS, type Slot } from "@/models/domain/enums";
import { parseRotation } from "@/models/rules/rotation";
import { parseRotationVideo } from "@/models/rules/rotationVideo";
import type { MetaScopeViewModel } from "@/viewmodels/admin/useMetaScopeViewModel";
import { useMetaTeamEditorViewModel } from "@/viewmodels/admin/useMetaTeamEditorViewModel";
import { HelpHint } from "@/views/layout/HelpHint";
import { MetaCycleBoard } from "./MetaCycleBoard";
import { ReservesEditor } from "./ReservesEditor";
import { TeamStrip } from "@/views/shared/TeamStrip";
import { UpdatedAt } from "@/views/shared/UpdatedAt";
import { CtpSelect } from "@/views/shared/CtpSelect";
import { EmptyTeam } from "@/views/shared/EmptyTeam";
import { QueryState } from "@/views/shared/QueryState";
import { RestrictionBadges } from "@/views/shared/RestrictionBadges";
import { RotationLegend, RotationSequence, RotationVideoPlayer } from "@/views/shared/RotationSequence";
import { UniformPicker } from "@/views/shared/UniformPicker";

/** Rotação de um Causador de Dano: sequência com prévia ao vivo e descrição. */
function RotationFields({
  slot,
  rotation,
  notes,
  videoUrl,
  onChange,
}: {
  slot: Slot;
  rotation: string;
  notes: string;
  videoUrl: string;
  onChange: (patch: { rotation?: string; rotationNotes?: string; rotationVideoUrl?: string }) => void;
}) {
  const { t } = useTranslation(["admin", "common"]);
  const parsed = rotation.trim() ? parseRotation(rotation) : null;
  const videoInvalid = !!videoUrl.trim() && !parseRotationVideo(videoUrl);
  return (
    <div className="flex flex-col gap-3">
      <Field data-invalid={parsed && !parsed.ok ? true : undefined}>
        <div className="flex items-center gap-1">
          <FieldLabel htmlFor={`rotation-${slot}`}>{t("admin:metas.rotation.label")}</FieldLabel>
          <HelpHint title={t("admin:metas.rotation.legendTitle")}>
            <RotationLegend />
            <p>{t("admin:metas.rotation.example")}</p>
          </HelpHint>
        </div>
        <Input
          id={`rotation-${slot}`}
          maxLength={120}
          className="font-mono"
          placeholder="1 2c (3dc 4) 6"
          value={rotation}
          aria-invalid={parsed && !parsed.ok ? true : undefined}
          onChange={(e) => onChange({ rotation: e.target.value })}
        />
        {parsed?.ok ? (
          <RotationSequence parts={parsed.parts} />
        ) : parsed ? (
          <FieldDescription className="text-destructive">
            {t(`admin:metas.rotation.errors.${parsed.error}`, { token: parsed.token })}
          </FieldDescription>
        ) : (
          <FieldDescription>{t("admin:metas.rotation.hint")}</FieldDescription>
        )}
      </Field>
      {parsed?.ok && (
        <Field>
          <FieldLabel htmlFor={`rotationNotes-${slot}`}>{t("admin:metas.rotation.notes")}</FieldLabel>
          <Textarea
            id={`rotationNotes-${slot}`}
            maxLength={500}
            placeholder={t("admin:metas.rotation.notesPlaceholder")}
            value={notes}
            onChange={(e) => onChange({ rotationNotes: e.target.value })}
          />
        </Field>
      )}
      {parsed?.ok && (
        <Field data-invalid={videoInvalid || undefined}>
          <FieldLabel htmlFor={`rotationVideo-${slot}`}>{t("admin:metas.rotation.video")}</FieldLabel>
          <Input
            id={`rotationVideo-${slot}`}
            type="url"
            inputMode="url"
            maxLength={300}
            placeholder="https://youtu.be/…?t=42"
            value={videoUrl}
            aria-invalid={videoInvalid || undefined}
            onChange={(e) => onChange({ rotationVideoUrl: e.target.value })}
          />
          <FieldDescription className={videoInvalid ? "text-destructive" : undefined}>
            {videoInvalid ? t("common:validation.rotationVideo") : t("admin:metas.rotation.videoHint")}
          </FieldDescription>
          {!videoInvalid && videoUrl.trim() && <RotationVideoPlayer url={videoUrl} title={t("admin:metas.rotation.video")} />}
        </Field>
      )}
    </div>
  );
}

/** Equipes do escopo. Dias de BAX/BAL: quadro do ciclo inteiro; BAL livre e BAI: lista do escopo. */
export function MetaTeamEditorView({ scopeVm }: { scopeVm: MetaScopeViewModel }) {
  const { t } = useTranslation(["admin", "common"]);
  const vm = useMetaTeamEditorViewModel(scopeVm, { saved: t("admin:common.saved"), deleted: t("admin:metas.deleted") });
  const { catalog } = scopeVm;

  return (
    <div className="flex flex-col gap-4">
      {scopeVm.isDay ? (
        <MetaCycleBoard scopeVm={scopeVm} vm={vm} />
      ) : (
        <>
          <div className="flex justify-end">
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
                      <Field>
                        <FieldLabel>{t("admin:metas.pickCtp")}</FieldLabel>
                        <CtpSelect
                          ctps={catalog.ctps}
                          value={member.ctpId}
                          onChange={(ctpId) => vm.setMember(slot, { ctpId })}
                          allowNone
                          placeholder={t("admin:metas.pickCtp")}
                          ariaLabel={`${t("admin:metas.pickCtp")} · ${t(`common:team.slots.${slot}`)}`}
                          targetName={member.uniformId ? catalog.uniformById(member.uniformId)?.agent.name : undefined}
                        />
                      </Field>
                      <div className="flex flex-col gap-3 border-t border-energy/10 pt-3 sm:col-span-2">
                        <Field orientation="horizontal">
                          <Switch
                            id={`damageDealer-${slot}`}
                            checked={member.isDamageDealer}
                            onCheckedChange={(isDamageDealer) => vm.setMember(slot, { isDamageDealer })}
                          />
                          <FieldLabel htmlFor={`damageDealer-${slot}`} className="flex items-center gap-1.5">
                            <SwordIcon className="size-3.5 text-spark" />
                            {t("admin:metas.damageDealer")}
                          </FieldLabel>
                        </Field>
                        {member.isDamageDealer && (
                          <RotationFields
                            slot={slot}
                            rotation={member.rotation}
                            notes={member.rotationNotes}
                            videoUrl={member.rotationVideoUrl}
                            onChange={(patch) => vm.setMember(slot, patch)}
                          />
                        )}
                      </div>
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
            <Button type="submit" form="meta-team-form" variant="energy" disabled={vm.isSaving}>
              {vm.isSaving ? t("admin:common.saving") : t("admin:common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
