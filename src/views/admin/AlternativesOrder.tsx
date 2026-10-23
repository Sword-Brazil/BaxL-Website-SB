import { useState } from "react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon, ClockArrowDownIcon, ClockArrowUpIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { MetaTeam } from "@/models/domain/types";
import type { CatalogViewModel } from "@/viewmodels/useCatalogViewModel";
import { BRT_TIME_ZONE } from "@/models/rules/battleClock";

/** Move o item de `from` para `to` numa cópia da lista. */
const move = <T,>(list: T[], from: number, to: number) => {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
};

/**
 * Ordena as equipes alternativas de um dia (a Meta principal fica sempre primeiro): subir/descer
 * cada uma ou usar uma ordem pronta por data (mais recente ou mais antiga primeiro).
 */
export function AlternativesOrder({
  teams,
  catalog,
  onSave,
  isSaving,
}: {
  teams: MetaTeam[];
  catalog: CatalogViewModel;
  onSave: (ids: string[]) => Promise<unknown>;
  isSaving: boolean;
}) {
  const { t } = useTranslation(["admin", "common"]);
  const { locale } = useRouter();
  const shortDate = new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: BRT_TIME_ZONE });
  const alternatives = teams.filter((tm) => !tm.isPrimary);
  const [draft, setDraft] = useState<MetaTeam[] | null>(null);
  if (alternatives.length < 2) return null;

  const byDate = (newest: boolean) =>
    setDraft((d) => [...(d ?? alternatives)].sort((a, b) => (newest ? -1 : 1) * a.updatedAt.localeCompare(b.updatedAt)));

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setDraft(alternatives)}>
        <ArrowUpDownIcon data-icon="inline-start" />
        {t("admin:metas.order.button")}
      </Button>
      <Dialog open={!!draft} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent className="flex max-h-[90dvh] flex-col gap-3 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("admin:metas.order.title")}</DialogTitle>
            <DialogDescription>{t("admin:metas.order.help")}</DialogDescription>
          </DialogHeader>
          {/* Ordens prontas por data da última atualização. */}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => byDate(true)}>
              <ClockArrowDownIcon data-icon="inline-start" />
              {t("admin:metas.order.newest")}
            </Button>
            <Button size="sm" variant="outline" onClick={() => byDate(false)}>
              <ClockArrowUpIcon data-icon="inline-start" />
              {t("admin:metas.order.oldest")}
            </Button>
          </div>
          <ol className="flex min-h-0 flex-col gap-1.5 overflow-y-auto">
            {draft?.map((team, i) => (
              <li key={team.id} className="flex items-center gap-2 rounded-lg border border-border bg-background/40 p-2">
                <span className="w-5 shrink-0 text-center font-heading text-sm font-bold text-muted-foreground tabular-nums">{i + 1}</span>
                <span className="flex shrink-0 -space-x-2">
                  {team.members.map((m) => {
                    const ref = catalog.uniformById(m.uniformId);
                    return (
                      <Avatar key={m.slot} className="size-8 ring-2 ring-card after:hidden">
                        <AvatarImage src={ref?.uniform.portrait || undefined} alt={ref?.agent.name ?? ""} className="object-cover" />
                        <AvatarFallback className="bg-secondary text-[0.55rem]">{ref?.agent.name.slice(0, 2) ?? "?"}</AvatarFallback>
                      </Avatar>
                    );
                  })}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium">{team.label ?? t("common:team.alternative")}</span>
                  {/* Data curta da última edição (base das ordens prontas). */}
                  <time dateTime={team.updatedAt} className="truncate text-[0.65rem] text-muted-foreground">
                    {shortDate.format(new Date(team.updatedAt))}
                  </time>
                </span>
                <Button
                  size="icon-touch"
                  variant="ghost"
                  disabled={i === 0}
                  onClick={() => setDraft((d) => d && move(d, i, i - 1))}
                  aria-label={t("admin:metas.order.up", { n: i + 1 })}
                >
                  <ArrowUpIcon />
                </Button>
                <Button
                  size="icon-touch"
                  variant="ghost"
                  disabled={i === (draft?.length ?? 0) - 1}
                  onClick={() => setDraft((d) => d && move(d, i, i + 1))}
                  aria-label={t("admin:metas.order.down", { n: i + 1 })}
                >
                  <ArrowDownIcon />
                </Button>
              </li>
            ))}
          </ol>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)}>
              {t("admin:common.cancel")}
            </Button>
            <Button
              variant="energy"
              loading={isSaving}
              onClick={async () => {
                if (!draft) return;
                try {
                  await onSave(draft.map((tm) => tm.id));
                  setDraft(null);
                } catch {
                  /* o erro já aparece na notificação; a janela fica aberta para tentar de novo */
                }
              }}
            >
              {t("admin:common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
