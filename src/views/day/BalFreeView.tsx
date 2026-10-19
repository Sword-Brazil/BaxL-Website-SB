import { useTranslation } from "next-i18next/pages";
import { Skeleton } from "@/components/ui/skeleton";
import { useSelectionsStore } from "@/viewmodels/stores/selectionsStore";
import { useCatalogViewModel } from "@/viewmodels/useCatalogViewModel";
import { useBalFreeViewModel } from "@/viewmodels/useDayViewModel";
import { HelpHint } from "@/views/layout/HelpHint";
import { EmptyTeam } from "@/views/shared/EmptyTeam";
import { QueryState } from "@/views/shared/QueryState";
import { TeamStrip } from "@/views/shared/TeamStrip";

export function BalFreeView() {
  const { t } = useTranslation(["days", "cycle", "common"]);
  const vm = useBalFreeViewModel();
  const catalog = useCatalogViewModel();
  const owned = new Set(useSelectionsStore((s) => s.doc.roster.ownedUniformIds));
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-bold">{t("days:free.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("days:free.subtitle")}</p>
        </div>
        <HelpHint title={t("days:free.help.title")}>
          <p>{t("days:free.help.text1")}</p>
        </HelpHint>
      </div>
      <QueryState
        isLoading={vm.isLoading || catalog.isLoading}
        isError={vm.isError || catalog.isError}
        retry={() => {
          vm.retry();
          catalog.refetch();
        }}
        skeleton={<Skeleton className="h-40 w-full" />}
      >
        {vm.teams.length === 0 ? (
          <EmptyTeam />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {vm.teams.map((team) => (
              <TeamStrip
                key={team.id}
                label={team.isPrimary ? t("cycle:meta") : (team.label ?? t("cycle:alternative"))}
                tone={team.isPrimary ? "meta" : "alt"}
                members={team.members}
                rotation={team}
                catalog={catalog}
                isOwned={owned.size ? (u) => owned.has(u) : undefined}
              />
            ))}
          </div>
        )}
      </QueryState>
    </div>
  );
}
