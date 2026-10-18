import { useTranslation } from "next-i18next/pages";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { UniformRef } from "@/viewmodels/useCatalogViewModel";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

/** Retrato do agente com o uniforme, nome e lado (herói/vilão). Mostra "indisponível" se inativo. */
export function AgentPortrait({
  refItem,
  size = "md",
  showName = true,
  className,
}: {
  refItem: UniformRef | null;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
  className?: string;
}) {
  const { t } = useTranslation("common");
  const dim = { sm: "size-10", md: "size-14", lg: "size-20" }[size];

  if (!refItem) {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <Avatar className={cn(dim, "rounded-md after:rounded-md")}>
          <AvatarFallback className="rounded-md">?</AvatarFallback>
        </Avatar>
        {showName && <Badge variant="outline">{t("team.unavailable")}</Badge>}
      </div>
    );
  }

  const { agent, uniform } = refItem;
  const unavailable = !uniform.active || !agent.active;
  const sideRing = agent.side === "HERO" ? "ring-hero/60" : "ring-villain/60";

  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      <Avatar className={cn(dim, "chamfer-sm rounded-none ring-2 after:hidden", sideRing, unavailable && "grayscale")}>
        <AvatarImage src={uniform.portrait || undefined} alt={`${agent.name} — ${uniform.name}`} loading="lazy" decoding="async" className="rounded-none" />
        <AvatarFallback className="rounded-none bg-secondary font-heading text-sm text-secondary-foreground">
          {initials(agent.name)}
        </AvatarFallback>
      </Avatar>
      {showName && (
        <div className="min-w-0">
          <p className="truncate font-heading font-semibold">{agent.name}</p>
          <div className="flex flex-wrap items-center gap-1">
            <span className="truncate text-xs text-muted-foreground">{uniform.name}</span>
            {unavailable ? (
              <Badge variant="outline">{t("team.unavailable")}</Badge>
            ) : (
              <Badge variant={agent.side === "HERO" ? "hero" : "villain"}>{t(`values.${agent.side}`)}</Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
