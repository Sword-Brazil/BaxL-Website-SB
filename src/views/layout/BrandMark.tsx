import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "next-i18next/pages";

/** Logo + nome da Sword Brasil para o cabeçalho. */
export function BrandMark() {
  const { t } = useTranslation("common");
  return (
    <Link href="/" className="flex items-center gap-2.5 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
      <Image
        src="/brand/sword-brazil-mark.png"
        alt=""
        width={40}
        height={40}
        priority
        className="chamfer-sm size-10 object-cover ring-1 ring-energy/40"
      />
      <span className="flex flex-col leading-none">
        <span className="font-heading text-base font-bold tracking-widest whitespace-nowrap text-energy uppercase max-[380px]:text-sm max-[380px]:tracking-wider">
          {t("brand.name")}
        </span>
        <span className="hidden text-[0.7rem] text-muted-foreground sm:inline">{t("brand.tagline")}</span>
      </span>
    </Link>
  );
}
