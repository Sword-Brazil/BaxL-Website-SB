import { useTranslation } from "next-i18next/pages";
import { Controller } from "react-hook-form";
import {
  ImageMinusIcon,
  ImageUpIcon,
  LoaderIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
  TriangleAlertIcon,
  Undo2Icon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Switch } from "@/components/ui/switch";
import { UNKNOWN } from "@/models/domain/enums";
import type { Agent } from "@/models/domain/types";
import { useCatalogEditorViewModel } from "@/viewmodels/admin/useCatalogEditorViewModel";
import { QueryState } from "@/views/shared/QueryState";
import { ATTRIBUTE_FIELDS, AttributeBadgePicker } from "./AttributeBadgePicker";

type Vm = ReturnType<typeof useCatalogEditorViewModel>;

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();

/** Retrato de lista: foto do traje Padrão (ou do primeiro com foto), ou iniciais. */
function AgentThumb({ agent }: { agent: Agent }) {
  const src = agent.uniforms.find((u) => u.portrait)?.portrait;
  return (
    <Avatar className="chamfer-sm size-10 shrink-0 rounded-none after:hidden">
      <AvatarImage src={src || undefined} alt="" loading="lazy" className="rounded-none" />
      <AvatarFallback className="rounded-none bg-secondary font-heading text-xs">{initials(agent.name)}</AvatarFallback>
    </Avatar>
  );
}

/** Atributos do traje: herdados do personagem (tracejados) ou próprios do traje. */
function UniformAttributes({ index, vm }: { index: number; vm: Vm }) {
  const { t } = useTranslation("admin");
  const { form } = vm;
  const own = form.watch(ATTRIBUTE_FIELDS.map((f) => `uniforms.${index}.${f.name}` as const));
  const base = form.watch(ATTRIBUTE_FIELDS.map((f) => f.name));
  const customized = own.some((v) => v != null);

  return (
    <div className="flex flex-col gap-2 rounded-md border border-dashed border-energy/20 p-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold tracking-wider uppercase">{t("catalog.uniformAttributes")}</span>
        {customized && (
          <div className="flex items-center gap-1">
            <Badge variant="energy">{t("catalog.customized")}</Badge>
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              onClick={() => ATTRIBUTE_FIELDS.forEach((f) => vm.setUniformAttribute(index, f.name, null))}
              aria-label={t("catalog.resetAttributes")}
              title={t("catalog.resetAttributes")}
            >
              <Undo2Icon />
            </Button>
          </div>
        )}
      </div>
      {ATTRIBUTE_FIELDS.map((f, i) => (
        <AttributeBadgePicker
          key={f.name}
          field={f}
          value={own[i] ?? null}
          inherited={base[i]}
          onChange={(v) => vm.setUniformAttribute(index, f.name, v)}
        />
      ))}
    </div>
  );
}

/** Cartão de um traje: prévia da foto, trocar/remover foto, nome, identificador, atributos e ativo. */
function UniformCard({ index, vm }: { index: number; vm: Vm }) {
  const { t } = useTranslation("admin");
  const { form } = vm;
  const imagePath = form.watch(`uniforms.${index}.imagePath`);
  const name = form.watch(`uniforms.${index}.name`);
  const agentName = form.watch("name");
  const isSaved = !!form.getValues(`uniforms.${index}.id`);
  const inputId = `upload-${index}`;
  const uploading = vm.uploadingIndex === index;

  return (
    <li className="flex min-w-0 flex-col gap-3 rounded-lg border border-energy/15 bg-background/40 p-3">
      <div className="flex gap-3">
        <Avatar className="chamfer-sm size-24 shrink-0 rounded-none bg-secondary after:hidden">
          <AvatarImage src={imagePath || undefined} alt={name} className="rounded-none" />
          <AvatarFallback className="rounded-none bg-secondary font-heading text-lg">{initials(agentName || name || "?")}</AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Input
            id={inputId}
            type="file"
            accept="image/png,image/webp,image/jpeg"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) vm.upload(index, file);
              e.target.value = "";
            }}
          />
          <Button type="button" size="sm" variant="outline" asChild disabled={uploading}>
            <label htmlFor={inputId} className="cursor-pointer">
              {uploading ? <LoaderIcon data-icon="inline-start" className="animate-spin" /> : <ImageUpIcon data-icon="inline-start" />}
              {imagePath ? t("catalog.changePhoto") : t("catalog.addPhoto")}
            </label>
          </Button>
          {imagePath ? (
            <Button type="button" size="sm" variant="ghost" onClick={() => vm.removeImage(index)}>
              <ImageMinusIcon data-icon="inline-start" />
              {t("catalog.removePhoto")}
            </Button>
          ) : (
            <p className="text-xs text-muted-foreground">{t("catalog.noPhoto")}</p>
          )}
          <p className="text-xs text-muted-foreground">{t("catalog.uploadHint")}</p>
        </div>
      </div>

      <Controller
        control={form.control}
        name={`uniforms.${index}.name`}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={`u-name-${index}`}>{t("catalog.uniformName")}</FieldLabel>
            <Input
              id={`u-name-${index}`}
              {...field}
              placeholder="Ex.: Marvel Zombies"
              onChange={(e) => {
                vm.onUniformNameChange(index, e.target.value);
                field.onChange(e);
              }}
              aria-invalid={fieldState.invalid}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Controller
        control={form.control}
        name={`uniforms.${index}.slug`}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={`u-slug-${index}`}>{t("catalog.uniformSlug")}</FieldLabel>
            <Input id={`u-slug-${index}`} {...field} className="font-mono text-xs" aria-invalid={fieldState.invalid} />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <UniformAttributes index={index} vm={vm} />
      <div className="flex items-center justify-between gap-2">
        <Controller
          control={form.control}
          name={`uniforms.${index}.active`}
          render={({ field }) => (
            <Field orientation="horizontal" className="w-auto">
              <Switch id={`u-active-${index}`} checked={field.value ?? true} onCheckedChange={field.onChange} />
              <FieldLabel htmlFor={`u-active-${index}`}>{t("catalog.active")}</FieldLabel>
            </Field>
          )}
        />
        {!isSaved && (
          <Button type="button" size="icon-sm" variant="ghost" onClick={() => vm.uniforms.remove(index)} aria-label={t("common.remove")}>
            <Trash2Icon className="text-destructive" />
          </Button>
        )}
      </div>
    </li>
  );
}

export function CatalogEditorView() {
  const { t } = useTranslation(["admin", "common"]);
  const vm = useCatalogEditorViewModel({
    saved: t("admin:common.saved"),
    uploaded: t("admin:catalog.uploaded"),
    tooBig: t("admin:catalog.tooBig"),
    badType: t("admin:catalog.badType"),
  });
  const { form } = vm;
  const rootError = form.formState.errors.root?.message;
  const uniformsError = form.formState.errors.uniforms?.root?.message ?? form.formState.errors.uniforms?.message;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <InputGroup className="w-full sm:max-w-sm">
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
        <Button variant="energy" className="w-full sm:w-auto" onClick={vm.openNew}>
          <PlusIcon data-icon="inline-start" />
          {t("admin:catalog.newAgent")}
        </Button>
      </div>

      <QueryState isLoading={vm.catalog.isLoading} isError={vm.catalog.isError} retry={vm.catalog.refetch}>
        {/* Lista (não tabela): cabe no celular com nome, atributos e ações sempre visíveis. */}
        <ul className="flex flex-col divide-y divide-foreground/10 rounded-xl ring-1 ring-foreground/10">
          {vm.agents.map((a) => {
            const withPhoto = a.uniforms.filter((u) => u.imagePath).length;
            const customized = a.uniforms.filter((u) => Object.values(u.overrides).some((v) => v != null)).length;
            return (
              <li key={a.id} className={cn("flex items-center gap-3 p-3", !a.active && "opacity-60")}>
                <AgentThumb agent={a} />
                <button type="button" className="min-w-0 flex-1 text-left" onClick={() => vm.openEdit(a)}>
                  <span className="flex min-w-0 flex-wrap items-center gap-1.5">
                    <span className="truncate font-medium">{a.name}</span>
                    {a.side !== UNKNOWN && (
                      <Badge variant={a.side === "HERO" ? "hero" : "villain"}>{t(`common:values.${a.side}`)}</Badge>
                    )}
                    {!a.active && <Badge variant="outline">{t("admin:catalog.inactive")}</Badge>}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    {ATTRIBUTE_FIELDS.filter((f) => f.name !== "side").map((f, i) => (
                      <span key={f.name} className={cn(a[f.name] === UNKNOWN && "text-spark")}>
                        {i > 0 && " · "}
                        {t(`common:values.${a[f.name]}`)}
                      </span>
                    ))}
                  </span>
                  <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                    {t("admin:catalog.photos", { n: withPhoto, total: a.uniforms.length })}
                    {customized > 0 && (
                      <Badge variant="energy">
                        {customized} {t("admin:catalog.customized")}
                      </Badge>
                    )}
                  </span>
                </button>
                <div className="flex shrink-0 gap-1">
                  <Button
                    size="icon-touch"
                    variant="ghost"
                    className="sm:w-auto sm:px-3"
                    onClick={() => vm.openEdit(a, true)}
                    aria-label={t("admin:catalog.addUniform")}
                  >
                    <PlusIcon />
                    <span className="hidden sm:inline">{t("admin:catalog.quickUniform")}</span>
                  </Button>
                  <Button size="icon-touch" variant="ghost" onClick={() => vm.openEdit(a)} aria-label={t("admin:common.edit")}>
                    <PencilIcon />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      </QueryState>

      <Dialog open={vm.isOpen} onOpenChange={(open) => !open && vm.close()}>
        <DialogContent className="top-0 left-0 flex h-dvh max-h-dvh w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none p-0 sm:top-1/2 sm:left-1/2 sm:h-[min(92dvh,60rem)] sm:w-[calc(100vw-3rem)] sm:max-w-5xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl">
          <DialogHeader className="shrink-0 gap-1 border-b border-energy/15 px-4 py-3 pr-12 text-left sm:px-6">
            <DialogTitle className="font-heading text-lg sm:text-xl">
              {vm.isNew ? t("admin:catalog.newAgent") : t("admin:catalog.editAgent")}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">{t("admin:catalog.help")}</DialogDescription>
          </DialogHeader>
          <form id="agent-form" onSubmit={vm.submit} noValidate className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
            <FieldGroup>
              {rootError && (
                <Alert variant="destructive">
                  <TriangleAlertIcon />
                  <AlertTitle>{rootError}</AlertTitle>
                </Alert>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <Controller
                  control={form.control}
                  name="name"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="agent-name">{t("admin:catalog.name")}</FieldLabel>
                      <Input
                        id="agent-name"
                        {...field}
                        placeholder="Ex.: Wanda"
                        onChange={(e) => {
                          vm.onAgentNameChange(e.target.value);
                          field.onChange(e);
                        }}
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
                <Controller
                  control={form.control}
                  name="slug"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="agent-slug">{t("admin:catalog.slug")}</FieldLabel>
                      <Input id="agent-slug" {...field} className="font-mono text-xs" aria-invalid={fieldState.invalid} />
                      <FieldDescription>{t("admin:catalog.slugAuto")}</FieldDescription>
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              </div>
              <FieldSet>
                <FieldLegend>{t("admin:catalog.baseAttributes")}</FieldLegend>
                <FieldDescription>{t("admin:catalog.baseAttributesHint")}</FieldDescription>
                <div className="grid gap-3 sm:grid-cols-2">
                  {ATTRIBUTE_FIELDS.map((f) => (
                    <Controller
                      key={f.name}
                      control={form.control}
                      name={f.name}
                      render={({ field }) => (
                        <AttributeBadgePicker field={f} value={field.value} onChange={(v) => field.onChange(v ?? UNKNOWN)} />
                      )}
                    />
                  ))}
                </div>
              </FieldSet>
              <Controller
                control={form.control}
                name="active"
                render={({ field }) => (
                  <Field orientation="horizontal">
                    <Switch id="agent-active" checked={field.value ?? true} onCheckedChange={field.onChange} />
                    <FieldLabel htmlFor="agent-active">{t("admin:catalog.active")}</FieldLabel>
                    <FieldDescription>{t("admin:catalog.deactivateHint")}</FieldDescription>
                  </Field>
                )}
              />

              <FieldSet>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <FieldLegend>{t("admin:catalog.uniforms")}</FieldLegend>
                  <Button type="button" size="sm" variant="outline" onClick={vm.addUniform}>
                    <PlusIcon data-icon="inline-start" />
                    {t("admin:catalog.addUniform")}
                  </Button>
                </div>
                <FieldDescription>{t("admin:catalog.inheritedHint")}</FieldDescription>
                {uniformsError && <p className="text-sm text-destructive">{uniformsError}</p>}
                <ul className="grid gap-3 md:grid-cols-2">
                  {vm.uniforms.fields.map((u, index) => (
                    <UniformCard key={u.id} index={index} vm={vm} />
                  ))}
                </ul>
              </FieldSet>
            </FieldGroup>
          </form>
          <DialogFooter className="mx-0 mb-0 shrink-0 flex-row justify-end rounded-none border-t border-energy/15 px-4 py-3 sm:px-6">
            <Button variant="outline" onClick={vm.close}>
              {t("admin:common.cancel")}
            </Button>
            <Button type="submit" form="agent-form" variant="energy" disabled={vm.isSaving || vm.uploadingIndex !== null}>
              {vm.isSaving ? t("admin:common.saving") : t("admin:common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
