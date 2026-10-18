import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "next-i18next/pages";
import { ImageUpIcon, LoaderIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CTP_QUALITIES, CTP_TYPES, type CtpQuality, type CtpType } from "@/models/domain/enums";
import type { Ctp } from "@/models/domain/types";
import { adminApi } from "@/models/api/admin";
import { ASSET_MAX_BYTES } from "@/models/schemas/admin";
import { useCatalogViewModel } from "@/viewmodels/useCatalogViewModel";

type Draft = { id?: string; type: CtpType; quality: CtpQuality; imagePath: string; active: boolean };
const blank: Draft = { type: CTP_TYPES[0], quality: CTP_QUALITIES[0], imagePath: "", active: true };
const TYPES: Record<string, "image/png" | "image/webp" | "image/jpeg"> = { "image/png": "image/png", "image/webp": "image/webp", "image/jpeg": "image/jpeg" };
const dataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result));
  reader.onerror = () => reject(reader.error);
  reader.readAsDataURL(file);
});

export function CtpAdminView() {
  const { t } = useTranslation(["admin", "common"]);
  const catalog = useCatalogViewModel();
  const qc = useQueryClient();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [uploading, setUploading] = useState(false);
  const save = useMutation({
    mutationFn: (value: Draft) => {
      const { id, ...body } = value;
      return id ? adminApi.updateCtp(id, body) : adminApi.createCtp(body);
    },
    onSuccess: async () => { await qc.invalidateQueries({ queryKey: ["catalog"] }); setDraft(null); toast.success(t("admin:common.saved")); },
    onError: (e: Error) => toast.error(e.message),
  });
  const edit = (ctp?: Ctp) => setDraft(ctp ? { id: ctp.id, type: ctp.type, quality: ctp.quality, imagePath: ctp.imagePath, active: ctp.active } : { ...blank });
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
    } catch (error) { toast.error(error instanceof Error ? error.message : String(error)); }
    finally { setUploading(false); }
  };

  return <>
    <div className="flex justify-end">
      <Button variant="energy" onClick={() => edit()}><PlusIcon data-icon="inline-start" />{t("admin:ctps.add")}</Button>
    </div>
    {catalog.isLoading ? <p className="text-sm text-muted-foreground">{t("common:loading")}</p> : catalog.isError ? <Button variant="outline" onClick={() => catalog.refetch()}>{t("common:retry")}</Button> :
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {catalog.ctps.map((ctp) => <Card key={ctp.id} className={!ctp.active ? "opacity-60" : undefined}>
          <CardHeader className="flex-row items-center gap-3 space-y-0">
            <Avatar className="size-16 rounded-none bg-secondary after:hidden"><AvatarImage src={ctp.imagePath || undefined} alt="" className="object-contain" /><AvatarFallback>CTP</AvatarFallback></Avatar>
            <div className="min-w-0 flex-1"><CardTitle className="text-base">{t(`common:ctp.${ctp.type}`)}</CardTitle><p className="text-sm text-muted-foreground">{t(`common:quality.${ctp.quality}`)}{!ctp.active && ` · ${t("admin:catalog.inactive")}`}</p></div>
          </CardHeader>
          <CardContent className="flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => edit(ctp)}><PencilIcon data-icon="inline-start" />{t("admin:common.edit")}</Button>
            {ctp.active ? <Button size="sm" variant="destructive" onClick={() => save.mutate({ id: ctp.id, type: ctp.type, quality: ctp.quality, imagePath: ctp.imagePath, active: false })}><Trash2Icon data-icon="inline-start" />{t("admin:ctps.remove")}</Button> : <Button size="sm" variant="outline" onClick={() => save.mutate({ id: ctp.id, type: ctp.type, quality: ctp.quality, imagePath: ctp.imagePath, active: true })}>{t("admin:ctps.restore")}</Button>}
          </CardContent>
        </Card>)}
      </div>}
    <Dialog open={!!draft} onOpenChange={(open) => !open && setDraft(null)}>
      {draft && <DialogContent>
        <DialogHeader><DialogTitle>{draft.id ? t("admin:ctps.edit") : t("admin:ctps.add")}</DialogTitle></DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field><FieldLabel>{t("admin:ctps.type")}</FieldLabel><Select value={draft.type} onValueChange={(value) => patchDraft({ type: value as CtpType })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CTP_TYPES.map((type) => <SelectItem key={type} value={type}>{t(`common:ctp.${type}`)}</SelectItem>)}</SelectContent></Select></Field>
            <Field><FieldLabel>{t("admin:ctps.quality")}</FieldLabel><Select value={draft.quality} onValueChange={(value) => patchDraft({ quality: value as CtpQuality })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CTP_QUALITIES.map((quality) => <SelectItem key={quality} value={quality}>{t(`common:quality.${quality}`)}</SelectItem>)}</SelectContent></Select></Field>
          </div>
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
