import { useTranslation } from "next-i18next/pages";
import { Trash2Icon } from "lucide-react";
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
import { MODES } from "@/models/domain/enums";
import { useResetTeamsViewModel, type ResetScope } from "@/viewmodels/useResetTeamsViewModel";

const SCOPES: ResetScope[] = ["ALL", ...MODES];

/** Botões para apagar as equipes montadas (todas ou de um modo), cada um com confirmação. */
export function ResetTeamsOptions() {
  const { t } = useTranslation("common");
  const vm = useResetTeamsViewModel();
  return (
    <div className="flex flex-wrap gap-2">
      {SCOPES.map((scope) => (
        <AlertDialog key={scope}>
          <AlertDialogTrigger asChild>
            <Button variant={scope === "ALL" ? "destructive" : "outline"} size="sm" disabled={!vm.hasTeams}>
              {scope === "ALL" && <Trash2Icon data-icon="inline-start" />}
              {scope === "ALL" ? t("resetTeams.all") : scope}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("resetTeams.title")}</AlertDialogTitle>
              <AlertDialogDescription>
                {scope === "ALL" ? t("resetTeams.confirmAll") : t("resetTeams.confirmMode", { mode: scope })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("actions.cancel")}</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={() => vm.reset(scope)}>
                {t("actions.confirm")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ))}
    </div>
  );
}
