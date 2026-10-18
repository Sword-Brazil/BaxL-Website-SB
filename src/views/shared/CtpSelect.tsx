import { useTranslation } from "next-i18next/pages";
import { ChevronDownIcon } from "lucide-react";
import type { Ctp } from "@/models/domain/types";
import { CtpBadge } from "./CtpBadge";
import { CtpPicker } from "./CtpPicker";

/** Campo de CTP com cara de select que abre a gaveta com todos os CTPs (boa no celular). */
export function CtpSelect({
  ctps,
  value,
  onChange,
  placeholder,
  ariaLabel,
  targetName,
}: {
  ctps: Ctp[];
  value: string | null;
  onChange: (ctpId: string | null) => void;
  /** Mantido por compatibilidade: a gaveta sempre permite remover o CTP escolhido. */
  allowNone?: boolean;
  placeholder: string;
  ariaLabel?: string;
  targetName?: string;
}) {
  const { t } = useTranslation("common");
  const active = ctps.filter((c) => c.active);
  const current = ctps.find((c) => c.id === value) ?? null;
  return (
    <CtpPicker ctps={active} value={value} onChange={onChange} targetName={targetName}>
      <button
        type="button"
        aria-label={ariaLabel}
        className="flex h-9 w-full min-w-0 items-center gap-2 rounded-md border border-input bg-transparent px-2.5 text-left text-sm shadow-xs transition-colors hover:bg-accent/40 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none dark:bg-input/30"
      >
        {current ? (
          <>
            <CtpBadge ctp={current} size="xs" />
            <span className="min-w-0 flex-1 truncate">
              {t(`ctp.${current.type}`)} · {t(`quality.${current.quality}`)}
            </span>
          </>
        ) : (
          <span className="min-w-0 flex-1 truncate text-muted-foreground">{placeholder}</span>
        )}
        <ChevronDownIcon className="size-4 shrink-0 opacity-50" />
      </button>
    </CtpPicker>
  );
}
