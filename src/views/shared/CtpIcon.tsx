import { useTranslation } from "next-i18next/pages";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ctpColor } from "@/models/domain/ctpColors";
import type { Ctp } from "@/models/domain/types";
import { CtpQualityFx } from "./CtpQualityFx";
import { Hint } from "./Hint";

const QUALITY_VARIANT = { NORMAL: "ctp-normal", MIGHTY: "ctp-mighty", BRILLIANT: "ctp-brilliant" } as const;
const QUALITY_RING = { NORMAL: "ring-ctp-normal", MIGHTY: "ring-ctp-mighty", BRILLIANT: "ring-ctp-brilliant" } as const;

/** Ícone do CTP com a cor da qualidade (Normal, Poderoso, Brilhante). */
export function CtpIcon({
  ctp,
  showLabel = true,
  size = "md",
  className,
}: {
  ctp: Ctp | null;
  showLabel?: boolean;
  size?: "sm" | "md";
  className?: string;
}) {
  const { t } = useTranslation("common");
  if (!ctp) return null;
  const name = t(`ctp.${ctp.type}`);
  const quality = t(`quality.${ctp.quality}`);
  const dim = size === "sm" ? "size-7" : "size-9";

  return (
    <Hint label={`${name} · ${quality}`}>
      <div className={cn("flex items-center gap-2", className)}>
        <Avatar className={cn(dim, "isolate bg-transparent ring-2 after:hidden", QUALITY_RING[ctp.quality])}>
          <AvatarImage src={ctp.imagePath} alt={`${name} ${quality}`} loading="lazy" decoding="async" className="object-contain p-0.5" />
          <AvatarFallback className="bg-secondary font-heading text-xs">{name.slice(0, 2)}</AvatarFallback>
          <CtpQualityFx quality={ctp.quality} color={ctpColor(ctp)} className="inset-0.5" />
        </Avatar>
        {showLabel && (
          <div className="flex flex-col gap-0.5 leading-none">
            <span className="text-xs font-medium">{name}</span>
            <Badge variant={QUALITY_VARIANT[ctp.quality]} className="h-4 px-1.5 text-[0.65rem]">
              {quality}
            </Badge>
          </div>
        )}
      </div>
    </Hint>
  );
}
