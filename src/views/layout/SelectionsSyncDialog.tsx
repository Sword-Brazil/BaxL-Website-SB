import { useTranslation } from "next-i18next/pages";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useSelectionsSyncViewModel } from "@/viewmodels/useSelectionsSyncViewModel";

/** Pergunta qual versão manter quando aparelho e conta divergem. */
export function SelectionsSyncDialog() {
  const { t } = useTranslation("common");
  const vm = useSelectionsSyncViewModel();
  return (
    <AlertDialog open={vm.conflict}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("sync.title")}</AlertDialogTitle>
          <AlertDialogDescription>{t("sync.text")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={vm.keepRemote}>{t("sync.keepRemote")}</AlertDialogCancel>
          <AlertDialogAction onClick={vm.keepLocal}>{t("sync.keepLocal")}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
