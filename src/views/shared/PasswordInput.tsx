import { useState, type ComponentProps, type CSSProperties } from "react";
import { useTranslation } from "next-i18next/pages";
import { CheckIcon, EyeIcon, EyeOffIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PASSWORD_RULES, passwordStrength, type PasswordRule } from "@/models/rules/passwordStrength";

/** Cor da barra por nível (0 = vazia … 4 = forte); o preenchimento é nível × 25%. */
const LEVEL_COLOR = ["var(--muted-foreground)", "var(--destructive)", "var(--spark)", "var(--energy)", "var(--brazil-green)"] as const;

/** Medidor de força: barra de progresso animada, nível e as regras que já foram cumpridas. */
export function PasswordStrengthMeter({ password, id }: { password: string; id?: string }) {
  const { t } = useTranslation("common");
  const { level, passed } = passwordStrength(password);
  const color = LEVEL_COLOR[level];
  return (
    <div id={id} className="flex flex-col gap-1.5" aria-live="polite">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="text-muted-foreground">{t("password.strength")}</span>
        {level > 0 && (
          <span className="font-medium transition-colors duration-300" style={{ color }}>
            {t(`password.levels.${level}`)}
          </span>
        )}
      </div>
      {/* Barra que enche e muda de cor conforme a senha fica mais forte (sem animação com "reduzir movimento"). */}
      <Progress
        value={level * 25}
        aria-label={t("password.strength")}
        aria-valuetext={level ? t(`password.levels.${level}`) : undefined}
        style={{ "--strength-color": color } as CSSProperties}
        className="h-1.5 *:data-[slot=progress-indicator]:bg-(--strength-color) *:data-[slot=progress-indicator]:duration-500 *:data-[slot=progress-indicator]:ease-out motion-reduce:*:data-[slot=progress-indicator]:transition-none"
      />
      <ul className="flex flex-wrap gap-1">
        {(Object.keys(PASSWORD_RULES) as PasswordRule[]).map((rule) => (
          <li
            key={rule}
            className={cn(
              "flex items-center gap-1 rounded-full border px-2 py-0.5 text-[0.7rem] transition-colors",
              passed[rule] ? "border-energy/50 bg-energy/10 text-energy" : "border-border text-muted-foreground",
            )}
          >
            <CheckIcon className={cn("size-3 transition-opacity", passed[rule] ? "opacity-100" : "opacity-30")} />
            {t(`password.rules.${rule}`)}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Campo de senha com botão de mostrar/ocultar. */
export function PasswordInput({ className, ...props }: Omit<ComponentProps<"input">, "type">) {
  const { t } = useTranslation("common");
  const [visible, setVisible] = useState(false);
  const label = visible ? t("password.hide") : t("password.show");
  return (
    <InputGroup className={className}>
      <InputGroupInput {...props} type={visible ? "text" : "password"} autoCapitalize="none" spellCheck={false} />
      <InputGroupAddon align="inline-end">
        <Tooltip>
          <TooltipTrigger asChild>
            <InputGroupButton size="icon-sm" aria-label={label} aria-pressed={visible} onClick={() => setVisible((v) => !v)}>
              {visible ? <EyeOffIcon /> : <EyeIcon />}
            </InputGroupButton>
          </TooltipTrigger>
          <TooltipContent>{label}</TooltipContent>
        </Tooltip>
      </InputGroupAddon>
    </InputGroup>
  );
}
