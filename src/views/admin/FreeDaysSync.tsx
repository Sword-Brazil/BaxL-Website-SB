import { useTranslation } from "next-i18next/pages";
import { Link2Icon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import type { CycleOverview } from "@/models/domain/types";
import { cn } from "@/lib/utils";
import { freeDayLabels, type FreeDaysSyncViewModel } from "@/viewmodels/admin/useFreeDaysSyncViewModel";

/** Chave da sincronização dos dias sem restrição, com a lista de quais são (por modo). */
export function FreeDaysSyncCard({ vm, cycle }: { vm: FreeDaysSyncViewModel; cycle: CycleOverview | undefined }) {
  const { t } = useTranslation("admin");
  const groups = (["BAX", "BAL"] as const).map((m) => freeDayLabels(cycle, m)).filter((g) => g.length > 0);
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-xl p-3 ring-1",
        vm.sync ? "bg-energy/5 ring-energy/30" : "bg-card/60 ring-foreground/10",
      )}
    >
      <Switch checked={vm.sync} disabled={vm.isLoading || vm.isSaving} onCheckedChange={vm.setSync} className="mt-0.5" />
      <span className="flex min-w-0 flex-col gap-1">
        <span className="flex items-center gap-1.5 text-sm font-medium">
          <Link2Icon className="size-4 text-energy" aria-hidden />
          {t("metas.freeSync.label")}
        </span>
        <span className="text-xs text-muted-foreground">{vm.sync ? t("metas.freeSync.on") : t("metas.freeSync.off")}</span>
        {/* Um grupo por modo: BAX só repete em BAX, BAL só em BAL. */}
        {groups.map((g) => (
          <span key={g[0]} className="flex flex-wrap gap-1">
            {g.map((d) => (
              <Badge key={d} variant="outline" className="text-[0.65rem]">
                {d}
              </Badge>
            ))}
          </span>
        ))}
      </span>
    </label>
  );
}

/** Selo de um dia livre sincronizado, no quadro do ciclo. */
export function FreeDaySyncedBadge() {
  const { t } = useTranslation("admin");
  return (
    <Badge variant="outline" className="border-energy/40 text-energy" title={t("metas.freeSync.on")}>
      <Link2Icon data-icon="inline-start" />
      {t("metas.freeSync.badge")}
    </Badge>
  );
}
