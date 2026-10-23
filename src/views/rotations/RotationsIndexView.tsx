import Link from "next/link";
import { useTranslation } from "next-i18next/pages";
import { ChevronRightIcon, SwordIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useRotationsViewModel } from "@/viewmodels/useRotationsViewModel";
import { HelpHint } from "@/views/layout/HelpHint";
import { QueryState } from "@/views/shared/QueryState";
import { RotationLegend } from "@/views/shared/RotationSequence";
import { UniformPreview } from "./UniformPreview";

/** Personagens com rotação cadastrada; cada um leva à tela de rotações dele. */
export function RotationsIndexView() {
  const { t } = useTranslation("rotations");
  const vm = useRotationsViewModel();
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-heading text-3xl font-bold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <HelpHint title={t("legendTitle")} guide="rotations">
          <RotationLegend />
        </HelpHint>
      </div>
      <QueryState
        isLoading={vm.isLoading}
        isError={vm.isError}
        retry={vm.retry}
        skeleton={<Skeleton className="h-40 w-full" />}
      >
        {vm.agentsWithRotations.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">{t("emptyAll")}</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {vm.agentsWithRotations.map((agent) => {
              const groups = vm.groupsOf(agent);
              const count = vm.rotationsOf(agent.id).length;
              const main = groups.find((g) => g.uniform)?.uniform ?? agent.uniforms[0] ?? null;
              return (
                <li key={agent.id}>
                  <Link
                    href={`/rotacoes/${agent.slug}`}
                    className="flex items-center gap-3 rounded-lg border border-border/70 bg-card p-2.5 transition-colors outline-none hover:border-spark/60 focus-visible:ring-3 focus-visible:ring-spark/50"
                  >
                    <UniformPreview uniform={main} name={agent.name} className="size-14" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-heading font-semibold">{agent.name}</span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <SwordIcon className="size-3 text-spark" />
                        {t("count", { count })}
                      </span>
                    </span>
                    <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </QueryState>
    </div>
  );
}
