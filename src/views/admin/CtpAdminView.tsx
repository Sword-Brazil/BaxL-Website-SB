import { useState, type CSSProperties } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "next-i18next/pages";
import { BanIcon, ImageUpIcon, LoaderIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { useNotifyError } from "@/viewmodels/useNotify";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ctpColor } from "@/models/domain/ctpColors";
import { CTP_QUALITIES, CTP_TYPES, type CtpQuality, type CtpType } from "@/models/domain/enums";
import type { Catalog, Ctp } from "@/models/domain/types";
import { adminApi } from "@/models/api/admin";
import { ASSET_MAX_BYTES } from "@/models/schemas/admin";
import { useCatalogViewModel } from "@/viewmodels/useCatalogViewModel";
import { CtpQualityFx } from "@/views/shared/CtpQualityFx";
import { Hint } from "@/views/shared/Hint";

type Draft = { id?: string; type: CtpType; quality: CtpQuality; imagePath: string; active: boolean };
const TYPES: Record<string, "image/png" | "image/webp" | "image/jpeg"> = { "image/png": "image/png", "image/webp": "image/webp", "image/jpeg": "image/jpeg" };
const dataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result));
  reader.onerror = () => reject(reader.error);
  reader.readAsDataURL(file);
});

/** Foto do CTP num medalhão redondo com anel e brilho na cor do CTP (em vez da caixa quadrada). */
function CtpMedallion({ ctp }: { ctp: Ctp }) {
  const color = ctpColor(ctp);
  return (
    <span className="size-16 shrink-0 justify-self-start rounded-full" style={{ boxShadow: `0 0 18px -4px ${color}` }}>
      <Avatar
        className="isolate size-16 bg-[radial-gradient(circle,var(--secondary)_0%,var(--card)_75%)] ring-2 ring-offset-2 ring-offset-card after:hidden"
        style={{ "--tw-ring-color": color } as CSSProperties}
      >
        <AvatarImage src={ctp.imagePath || undefined} alt="" className="object-contain p-1.5" />
        <AvatarFallback className="bg-transparent font-heading text-xs">CTP</AvatarFallback>
        <CtpQualityFx quality={ctp.quality} color={color} className="inset-1.5" />
      </Avatar>
    </span>
  );
}

export function CtpAdminView() {
  const { t } = useTranslation(["admin", "common"]);
  const notifyError = useNotifyError();
  const catalog = useCatalogViewModel();
  const qc = useQueryClient();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [uploading, setUploading] = useState(false);
  const save = useMutation({
    mutationFn: (value: Draft) => {
      const { id, ...body } = value;
      return id ? adminApi.updateCtp(id, body) : adminApi.createCtp(body);
    },
    onSuccess: (saved) => {
      qc.setQueryData<Catalog>(["catalog"], (current) => current && {
        ...current,
        ctps: current.ctps.some((ctp) => ctp.id === saved.id)
          ? current.ctps.map((ctp) => ctp.id === saved.id ? saved : ctp)
          : [...current.ctps, saved].sort((a, b) => CTP_TYPES.indexOf(a.type) - CTP_TYPES.indexOf(b.type) || CTP_QUALITIES.indexOf(a.quality) - CTP_QUALITIES.indexOf(b.quality)),
      });
      setDraft(null);
      toast.success(t("admin:common.saved"));
    },
    onError: (e: Error) => notifyError(e),
  });
  /** Exclusão definitiva: as equipes e reservas que usavam o CTP ficam sem CTP. */
  const remove = useMutation({
    mutationFn: (id: string) => adminApi.deleteCtp(id),
    onSuccess: (_, id) => {
      qc.setQueryData<Catalog>(["catalog"], (current) => current && { ...current, ctps: current.ctps.filter((ctp) => ctp.id !== id) });
      qc.invalidateQueries({ queryKey: ["cycle"] });
      toast.success(t("admin:ctps.deleted"));
    },
    onError: (e: Error) => notifyError(e),
  });
  const edit = (ctp: Ctp) => setDraft({ id: ctp.id, type: ctp.type, quality: ctp.quality, imagePath: ctp.imagePath, active: ctp.active });
  /** Qualidades ainda livres no tipo (a do próprio CTP em edição continua disponível). */
  const freeQualities = (type: CtpType, exceptId?: string) =>
    CTP_QUALITIES.filter((q) => !catalog.ctps.some((c) => c.type === type && c.quality === q && c.id !== exceptId));
  // O tipo vem do grupo onde o CTP é adicionado: não há o que escolher.
  const add = (type: CtpType) => setDraft({ type, quality: freeQualities(type)[0], imagePath: "", active: true });
  const patchDraft = (patch: Partial<Draft>) => setDraft((current) => current ? { ...current, ...patch } : current);
  const upload = async (file?: File) => {
    if (!file || !draft) return;
    try {
      if (!TYPES[file.type]) throw new Error(t("admin:catalog.badType"));
      if (file.size > ASSET_MAX_BYTES) throw new Error(t("admin:catalog.tooBig"));
      setUploading(true);
      const result = await adminApi.uploadAsset({ fileName: file.name, mimeType: TYPES[file.type], base64: await dataUrl(file) });
      patchDraft({ imagePath: result.imagePath });
      toast.success(t("admin:catalog.uploaded"));
    } catch (error) { notifyError(error); }
    finally { setUploading(false); }
  };

  return <>
    {catalog.isLoading ? <p className="text-sm text-muted-foreground">{t("common:loading")}</p> : catalog.isError ? <Button variant="outline" onClick={() => catalog.refetch()}>{t("common:retry")}</Button> :
      <div className="flex flex-col gap-6">{CTP_TYPES.map((type) => <section key={type} className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-heading text-lg tracking-wider text-energy uppercase">{t(`common:ctp.${type}`)}</h2>
          {freeQualities(type).length > 0 && <Button size="sm" variant="energy" onClick={() => add(type)}><PlusIcon data-icon="inline-start" />{t("admin:ctps.add")}</Button>}
        </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {catalog.ctps.filter((ctp) => ctp.type === type).map((ctp) => <Card key={ctp.id} className={!ctp.active ? "opacity-60" : undefined}>
          <CardHeader className="flex-row items-center gap-3 space-y-0">
            <CtpMedallion ctp={ctp} />
            <div className="min-w-0 flex-1"><CardTitle className="text-base">{t(`common:ctp.${ctp.type}`)}</CardTitle><p className="text-sm text-muted-foreground">{t(`common:quality.${ctp.quality}`)}{!ctp.active && ` · ${t("admin:catalog.inactive")}`}</p></div>
          </CardHeader>
          <CardContent className="flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => edit(ctp)}><PencilIcon data-icon="inline-start" />{t("admin:common.edit")}</Button>
            {ctp.active ? <Button size="sm" variant="outline" onClick={() => save.mutate({ id: ctp.id, type: ctp.type, quality: ctp.quality, imagePath: ctp.imagePath, active: false })}><BanIcon data-icon="inline-start" />{t("admin:ctps.deactivate")}</Button> : <Button size="sm" variant="outline" onClick={() => save.mutate({ id: ctp.id, type: ctp.type, quality: ctp.quality, imagePath: ctp.imagePath, active: true })}>{t("admin:ctps.restore")}</Button>}
            <AlertDialog>
              <Hint label={t("admin:ctps.delete")}><AlertDialogTrigger asChild><Button size="icon-sm" variant="ghost" aria-label={t("admin:ctps.delete")}><Trash2Icon className="text-destructive" /></Button></AlertDialogTrigger></Hint>
              <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>{t("admin:ctps.delete")}</AlertDialogTitle><AlertDialogDescription>{t("admin:ctps.deleteConfirm", { name: `${t(`common:ctp.${ctp.type}`)} · ${t(`common:quality.${ctp.quality}`)}` })}</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel>{t("admin:common.cancel")}</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={() => remove.mutate(ctp.id)}>{t("admin:ctps.delete")}</AlertDialogAction></AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>)}
      </div>
      </section>)}</div>}
    <Dialog open={!!draft} onOpenChange={(open) => !open && setDraft(null)}>
      {draft && <DialogContent>
        <DialogHeader><DialogTitle>{draft.id ? t("admin:ctps.edit") : t("admin:ctps.add")} · {t(`common:ctp.${draft.type}`)}</DialogTitle></DialogHeader>
        <div className="flex flex-col gap-4">
          <Field><FieldLabel>{t("admin:ctps.quality")}</FieldLabel><Select value={draft.quality} onValueChange={(value) => patchDraft({ quality: value as CtpQuality })}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{freeQualities(draft.type, draft.id).map((quality) => <SelectItem key={quality} value={quality}>{t(`common:quality.${quality}`)}</SelectItem>)}</SelectContent></Select></Field>
          <div className="flex items-center gap-3">
            <Avatar className="size-20 rounded-none bg-secondary after:hidden"><AvatarImage src={draft.imagePath || undefined} alt="" className="object-contain" /><AvatarFallback>CTP</AvatarFallback></Avatar>
            <div><Input id="ctp-image" type="file" accept="image/png,image/webp,image/jpeg" className="hidden" onChange={(event) => { void upload(event.target.files?.[0]); event.target.value = ""; }} /><Button type="button" variant="outline" asChild disabled={uploading}><label htmlFor="ctp-image" className="cursor-pointer">{uploading ? <LoaderIcon data-icon="inline-start" className="animate-spin" /> : <ImageUpIcon data-icon="inline-start" />}{draft.imagePath ? t("admin:catalog.changePhoto") : t("admin:catalog.addPhoto")}</label></Button><p className="mt-1 text-xs text-muted-foreground">{t("admin:catalog.uploadHint")}</p></div>
          </div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => setDraft(null)}>{t("admin:common.cancel")}</Button><Button variant="energy" disabled={save.isPending || uploading} onClick={() => save.mutate(draft)}>{t("admin:common.save")}</Button></DialogFooter>
      </DialogContent>}
    </Dialog>
  </>;
}
