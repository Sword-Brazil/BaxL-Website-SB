import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "next-i18next/pages";
import { cn } from "@/lib/utils";

/**
 * Logo + nome da Sword Brasil para o cabeçalho. `compact`: em telas de até 400px (ex.: 360px do
 * Galaxy A55) fica só o logo, para caber o menu e os botões da conta.
 */
export function BrandMark({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation("common");
  return (
    // xl:shrink-0: ao lado do menu completo, o nome e o subtítulo não são espremidos (quebravam em
    // duas linhas e invadiam o menu). Abaixo disso, o subtítulo pode quebrar como antes.
    <Link href="/" className="flex items-center gap-2.5 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50 xl:shrink-0">
      <Image
        src="/brand/sword-brazil-mark.png"
        alt=""
        width={40}
        height={40}
        priority
        className="chamfer-sm size-10 object-cover ring-1 ring-energy/40"
      />
      <span className={cn("flex flex-col leading-none", compact && "max-[400px]:sr-only")}>
        <span className="font-heading text-base font-bold tracking-widest whitespace-nowrap text-energy uppercase max-[380px]:text-sm max-[380px]:tracking-wider">
          {t("brand.name")}
        </span>
        <span className="hidden text-[0.7rem] text-muted-foreground sm:inline">{t("brand.tagline")}</span>
      </span>
    </Link>
  );
}
