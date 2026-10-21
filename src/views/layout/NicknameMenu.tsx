import { useState } from "react";
import { useTranslation } from "next-i18next/pages";
import { CheckIcon, UserRoundPenIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useSelectionsStore } from "@/viewmodels/stores/selectionsStore";

/** Nome no jogo do jogador, no topo do site. Fica só neste aparelho, junto com o elenco e as equipes. */
export function NicknameMenu() {
  const { t } = useTranslation("common");
  const nickname = useSelectionsStore((s) => s.doc.nickname);
  const hydrated = useSelectionsStore((s) => s.hydrated);
  const setNickname = useSelectionsStore((s) => s.setNickname);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        if (o) setDraft(nickname);
        setOpen(o);
      }}
    >
      <PopoverTrigger asChild>
        <Button variant="ghost" className="h-11 max-w-44 gap-1.5 px-2.5" aria-label={t("nickname.label")}>
          <UserRoundPenIcon data-icon="inline-start" />
          <span className="hidden truncate sm:inline">{hydrated && nickname ? nickname : t("nickname.placeholder")}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setNickname(draft);
            setOpen(false);
          }}
        >
          <Field>
            <FieldLabel htmlFor="nickname">{t("nickname.label")}</FieldLabel>
            <div className="flex gap-2">
              <Input id="nickname" maxLength={30} autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={t("nickname.placeholder")} />
              <Button type="submit" size="icon" variant="energy" aria-label={t("actions.save")}>
                <CheckIcon />
              </Button>
            </div>
            <FieldDescription>{t("nickname.hint")}</FieldDescription>
          </Field>
        </form>
      </PopoverContent>
    </Popover>
  );
}
