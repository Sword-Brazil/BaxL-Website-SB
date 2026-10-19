import { useTranslation } from "next-i18next/pages";
import { ArrowDownIcon, ArrowUpIcon, PencilIcon, PlusIcon, SearchIcon, SwordIcon, Trash2Icon, TriangleAlertIcon } from "lucide-react";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { Agent } from "@/models/domain/types";
import { parseRotationVideo } from "@/models/rules/rotationVideo";
import { useRotationsEditorViewModel, type RotationDraft } from "@/viewmodels/admin/useRotationsEditorViewModel";
import { HelpHint } from "@/views/layout/HelpHint";
import { QueryState } from "@/views/shared/QueryState";
import { RotationLegend, RotationText, RotationVideoPlayer } from "@/views/shared/RotationSequence";
import { UniformPreview } from "@/views/rotations/UniformPreview";

type Vm = ReturnType<typeof useRotationsEditorViewModel>;

const ALL = "__all";

/** Uma rotação: traje, título, sequência livre (com prévia), descrição e vídeo. */
function RotationEditor({ draft, index, total, agent, vm }: { draft: RotationDraft; index: number; total: number; agent: Agent; vm: Vm }) {
  const { t } = useTranslation(["admin", "common"]);
  const id = (name: string) => `${name}-${draft.key}`;
  const videoInvalid = !!draft.videoUrl.trim() && !parseRotationVideo(draft.videoUrl);
  const uniform = agent.uniforms.find((u) => u.id === draft.uniformId) ?? null;
  return (
    <li className="flex flex-col gap-3 rounded-lg border border-spark/25 bg-background/40 p-3">
      <div className="flex items-center gap-2">
        <UniformPreview uniform={uniform} name={agent.name} fallbackSrc={agent.uniforms.find((u) => u.portrait)?.portrait} className="size-12" />
        <span className="font-heading text-xs tracking-widest text-spark uppercase">{t("admin:rotations.item", { n: index + 1 })}</span>
        <div className="ml-auto flex gap-1">
          <Button type="button" size="icon-sm" variant="ghost" disabled={index === 0} onClick={() => vm.move(draft.key, -1)} aria-label={t("admin:rotations.moveUp")}>
            <ArrowUpIcon />
          </Button>
          <Button type="button" size="icon-sm" variant="ghost" disabled={index === total - 1} onClick={() => vm.move(draft.key, 1)} aria-label={t("admin:rotations.moveDown")}>
            <ArrowDownIcon />
          </Button>
          <Button type="button" size="icon-sm" variant="ghost" onClick={() => vm.remove(draft.key)} aria-label={t("admin:common.delete")}>
            <Trash2Icon className="text-destructive" />
          </Button>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor={id("uniform")}>{t("admin:rotations.uniform")}</FieldLabel>
          <Select value={draft.uniformId ?? ALL} onValueChange={(v) => vm.update(draft.key, { uniformId: v === ALL ? null : v })}>
            <SelectTrigger id={id("uniform")} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{t("admin:rotations.allUniforms")}</SelectItem>
              {agent.uniforms
                .filter((u) => u.active || u.id === draft.uniformId)
                .map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor={id("title")}>{t("admin:rotations.titleLabel")}</FieldLabel>
          <Input
            id={id("title")}
            maxLength={80}
            placeholder={t("admin:rotations.titlePlaceholder")}
            value={draft.title}
            onChange={(e) => vm.update(draft.key, { title: e.target.value })}
          />
        </Field>
      </div>
      <Field>
        <div className="flex items-center gap-1">
          <FieldLabel htmlFor={id("sequence")}>{t("admin:rotations.sequence")}</FieldLabel>
          <HelpHint title={t("admin:rotations.legendTitle")}>
            <RotationLegend />
            <p>{t("admin:rotations.legendFree")}</p>
          </HelpHint>
        </div>
        <Textarea
          id={id("sequence")}
          maxLength={1000}
          rows={2}
          placeholder={t("admin:rotations.sequencePlaceholder")}
          value={draft.sequence}
          onChange={(e) => vm.update(draft.key, { sequence: e.target.value })}
        />
        {draft.sequence.trim() ? <RotationText text={draft.sequence} /> : <FieldDescription>{t("admin:rotations.sequenceHint")}</FieldDescription>}
      </Field>
      <Field>
        <FieldLabel htmlFor={id("description")}>{t("admin:rotations.description")}</FieldLabel>
        <Textarea
          id={id("description")}
          maxLength={3000}
          rows={4}
          placeholder={t("admin:rotations.descriptionPlaceholder")}
          value={draft.description}
          onChange={(e) => vm.update(draft.key, { description: e.target.value })}
        />
      </Field>
      <Field data-invalid={videoInvalid || undefined}>
        <FieldLabel htmlFor={id("video")}>{t("admin:rotations.video")}</FieldLabel>
        <Input
          id={id("video")}
          type="url"
          inputMode="url"
          maxLength={300}
          placeholder="https://youtu.be/…?t=42"
          value={draft.videoUrl}
          aria-invalid={videoInvalid || undefined}
          onChange={(e) => vm.update(draft.key, { videoUrl: e.target.value })}
        />
        <FieldDescription className={videoInvalid ? "text-destructive" : undefined}>
          {videoInvalid ? t("common:validation.rotationVideo") : t("admin:rotations.videoHint")}
        </FieldDescription>
        {!videoInvalid && draft.videoUrl.trim() && <RotationVideoPlayer url={draft.videoUrl} title={agent.name} />}
      </Field>
    </li>
  );
}

/** Aba "Rotações": personagens e as rotações de cada um (por traje ou para todos). */
export function RotationsAdminView() {
  const { t } = useTranslation(["admin", "common"]);
  const vm = useRotationsEditorViewModel({ saved: t("admin:common.saved") });
  const agent = vm.agent;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <InputGroup className="sm:max-w-sm">
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            placeholder={t("admin:catalog.search")}
            value={vm.search}
            onChange={(e) => vm.setSearch(e.target.value)}
            aria-label={t("admin:catalog.search")}
          />
        </InputGroup>
        <Field orientation="horizontal" className="sm:ml-2 sm:w-auto">
          <Switch id="only-with" checked={vm.onlyWithRotations} onCheckedChange={vm.setOnlyWithRotations} />
          <FieldLabel htmlFor="only-with">{t("admin:rotations.onlyWith")}</FieldLabel>
        </Field>
      </div>

      <QueryState isLoading={vm.isLoading} isError={vm.isError} retry={vm.retry}>
        <ul className="flex flex-col divide-y divide-foreground/10 rounded-xl ring-1 ring-foreground/10">
          {vm.agents.map((a) => {
            const count = vm.rotationsOf(a.id).length;
            return (
              <li key={a.id} className="flex items-center gap-3 p-3">
                <UniformPreview uniform={a.uniforms.find((u) => u.portrait) ?? a.uniforms[0] ?? null} name={a.name} className="size-10" />
                <button type="button" className="min-w-0 flex-1 text-left" onClick={() => vm.open(a)}>
                  <span className="block truncate font-medium">{a.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {count ? (
                      <Badge variant="outline" className="border-spark/40 text-spark">
                        <SwordIcon />
                        {t("admin:rotations.count", { count })}
                      </Badge>
                    ) : (
                      t("admin:rotations.none")
                    )}
                  </span>
                </button>
                <Button size="icon-touch" variant="ghost" onClick={() => vm.open(a)} aria-label={t("admin:common.edit")}>
                  <PencilIcon />
                </Button>
              </li>
            );
          })}
        </ul>
      </QueryState>

      <Dialog open={!!agent} onOpenChange={(o) => !o && vm.close()}>
        {/* Celular: tela cheia com rodapé fixo. PC: janela com rolagem interna. */}
        <DialogContent className="top-0 left-0 flex h-dvh max-h-dvh w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none p-0 sm:top-1/2 sm:left-1/2 sm:h-auto sm:max-h-[90dvh] sm:max-w-3xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl">
          <DialogHeader className="shrink-0 gap-1 border-b border-energy/15 px-4 py-3 pr-12 text-left sm:px-6">
            <DialogTitle>{agent ? t("admin:rotations.editTitle", { name: agent.name }) : ""}</DialogTitle>
            <DialogDescription>{t("admin:rotations.editHelp")}</DialogDescription>
          </DialogHeader>
          {agent && (
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
              <FieldGroup>
                {vm.error && (
                  <Alert variant="destructive">
                    <TriangleAlertIcon />
                    <AlertTitle>{vm.error}</AlertTitle>
                  </Alert>
                )}
                <ul className="flex flex-col gap-3">
                  {vm.drafts.map((d, i) => (
                    <RotationEditor key={d.key} draft={d} index={i} total={vm.drafts.length} agent={agent} vm={vm} />
                  ))}
                </ul>
                <Button type="button" variant="outline" className="self-start" onClick={vm.add}>
                  <PlusIcon data-icon="inline-start" />
                  {t("admin:rotations.add")}
                </Button>
              </FieldGroup>
            </div>
          )}
          <DialogFooter className="mx-0 mb-0 shrink-0 flex-row justify-end rounded-none border-t border-energy/15 px-4 py-3 sm:px-6">
            <Button variant="outline" onClick={vm.close}>
              {t("admin:common.cancel")}
            </Button>
            <Button variant="energy" onClick={vm.submit} disabled={vm.isSaving}>
              {vm.isSaving ? t("admin:common.saving") : t("admin:common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
