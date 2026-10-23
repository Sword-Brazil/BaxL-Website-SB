import { useTranslation } from "next-i18next/pages";
import { ArrowDownIcon, ArrowUpIcon, PlusIcon, SaveIcon, Trash2Icon, TriangleAlertIcon } from "lucide-react";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useBaiEditorViewModel } from "@/viewmodels/admin/useBaiEditorViewModel";
import { QueryState } from "@/views/shared/QueryState";

export function BaiEditorView() {
  const { t } = useTranslation("admin");
  const vm = useBaiEditorViewModel({ saved: t("common.saved") });
  return (
    <QueryState isLoading={vm.isLoading} isError={vm.isError} retry={vm.retry}>
      <div className="flex flex-col gap-3">
        {vm.error && (
          <Alert variant="destructive">
            <TriangleAlertIcon />
            <AlertTitle>{vm.error}</AlertTitle>
          </Alert>
        )}
        {vm.bosses.length === 0 && <p className="text-sm text-muted-foreground">{t("common.none")}</p>}
        <ol className="flex flex-col gap-3">
          {vm.bosses.map((b, i) => (
            <li key={i}>
              <Card variant="panel" size="sm">
                <CardContent className="grid gap-3 sm:grid-cols-[3rem_1fr_1fr_auto]">
                  <span className="font-heading text-3xl font-bold text-energy">{i + 1}</span>
                  <Field>
                    <FieldLabel htmlFor={`boss-name-${i}`}>{t("bai.name")}</FieldLabel>
                    <Input id={`boss-name-${i}`} maxLength={80} value={b.name} onChange={(e) => vm.update(i, { name: e.target.value })} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor={`boss-img-${i}`}>{t("bai.image")}</FieldLabel>
                    <Input
                      id={`boss-img-${i}`}
                      placeholder="/assets/uploads/…"
                      value={b.imagePath}
                      onChange={(e) => vm.update(i, { imagePath: e.target.value })}
                    />
                  </Field>
                  <div className="flex items-end">
                    <Button size="icon-sm" variant="ghost" onClick={() => vm.move(i, i - 1)} aria-label={t("common.moveUp")}>
                      <ArrowUpIcon />
                    </Button>
                    <Button size="icon-sm" variant="ghost" onClick={() => vm.move(i, i + 1)} aria-label={t("common.moveDown")}>
                      <ArrowDownIcon />
                    </Button>
                    <Button size="icon-sm" variant="ghost" onClick={() => vm.remove(i)} aria-label={t("common.remove")}>
                      <Trash2Icon className="text-destructive" />
                    </Button>
                  </div>
                  <Field className="sm:col-span-2 sm:col-start-2">
                    <FieldLabel htmlFor={`boss-name-en-${i}`}>{t("bai.nameEn")}</FieldLabel>
                    <Input
                      id={`boss-name-en-${i}`}
                      maxLength={80}
                      value={b.nameEn}
                      placeholder={t("catalog.nameEnPlaceholder")}
                      onChange={(e) => vm.update(i, { nameEn: e.target.value })}
                    />
                  </Field>
                  <Field className="sm:col-span-4">
                    <FieldLabel htmlFor={`boss-tips-${i}`}>{t("bai.tips")}</FieldLabel>
                    <Textarea id={`boss-tips-${i}`} maxLength={500} value={b.tips} onChange={(e) => vm.update(i, { tips: e.target.value })} />
                  </Field>
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>
        <div className="flex flex-wrap justify-between gap-2">
          <Button variant="outline" onClick={vm.add}>
            <PlusIcon data-icon="inline-start" />
            {t("bai.add")}
          </Button>
          <Button variant="energy" disabled={!vm.dirty} loading={vm.isSaving} onClick={vm.save}>
            <SaveIcon data-icon="inline-start" />
            {vm.isSaving ? t("common.saving") : t("common.save")}
          </Button>
        </div>
      </div>
    </QueryState>
  );
}
