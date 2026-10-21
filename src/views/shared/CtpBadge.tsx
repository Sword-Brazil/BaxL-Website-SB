import type * as React from "react";
import { useTranslation } from "next-i18next/pages";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ctpColor } from "@/models/domain/ctpColors";
import type { Ctp } from "@/models/domain/types";
import { CtpQualityFx } from "./CtpQualityFx";

/**
 * Ícone compacto de CTP com tooltip. O anel tem a cor exata do CTP (tipo × qualidade). `typeOnly` para as recomendações da Meta, que trazem só o tipo
 * (anel neutro, sem qualidade).
 */
export function CtpBadge({
  ctp,
  typeOnly = false,
  size = "sm",
  className,
}: {
  ctp: Ctp | null;
  typeOnly?: boolean;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}) {
  const { t } = useTranslation("common");
  if (!ctp) return null;
  const name = t(`ctp.${ctp.type}`);
  const label = typeOnly ? name : `${name} · ${t(`quality.${ctp.quality}`)}`;
  const dim = { xs: "size-5", sm: "size-6", md: "size-8", lg: "size-9" }[size];
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn("inline-flex shrink-0", className)} aria-label={label} role="img">
          <Avatar
            className={cn(dim, "isolate bg-card ring-2 after:hidden", typeOnly && "ring-energy/50")}
            style={typeOnly ? undefined : ({ "--tw-ring-color": ctpColor(ctp) } as React.CSSProperties)}
          >
            <AvatarImage src={ctp.imagePath} alt="" loading="lazy" decoding="async" className="object-contain p-px" />
            <AvatarFallback className="bg-secondary font-heading text-[0.55rem] leading-none">{name.slice(0, 2)}</AvatarFallback>
            {!typeOnly && <CtpQualityFx quality={ctp.quality} color={ctpColor(ctp)} className="inset-px" />}
          </Avatar>
        </span>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
