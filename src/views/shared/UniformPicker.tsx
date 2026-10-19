import { useState } from "react";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { AttributeLabel } from "./AttributeLabel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { UniformRef } from "@/viewmodels/useCatalogViewModel";
import { AgentPortrait } from "./AgentPortrait";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

/** Combobox (Command + Popover do shadcn) para escolher um uniforme de agente, com foto ou iniciais. */
export function UniformPicker({
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  emptyText,
  disabled,
  ariaLabel,
}: {
  options: UniformRef[];
  value: UniformRef | null;
  onChange: (uniformId: string) => void;
  placeholder: string;
  searchPlaceholder: string;
  emptyText: string;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const byAgent = new Map<string, UniformRef[]>();
  for (const o of options) byAgent.set(o.agent.name, [...(byAgent.get(o.agent.name) ?? []), o]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={ariaLabel}
          disabled={disabled}
          className="h-auto min-h-11 w-full justify-between py-1.5"
        >
          {value ? <AgentPortrait refItem={value} size="sm" /> : <span className="text-muted-foreground">{placeholder}</span>}
          <ChevronsUpDownIcon className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) min-w-72 p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            {[...byAgent.entries()].map(([agentName, refs]) => (
              <CommandGroup key={agentName}>
                {refs.map((r) => (
                  <CommandItem
                    key={r.uniform.id}
                    value={`${r.agent.name} ${r.uniform.name} ${r.uniform.id}`}
                    onSelect={() => {
                      onChange(r.uniform.id);
                      setOpen(false);
                    }}
                  >
                    <Avatar
                      className={cn(
                        "chamfer-sm size-9 shrink-0 rounded-none ring-2 after:hidden",
                        r.uniform.side === "HERO" ? "ring-hero/60" : r.uniform.side === "VILLAIN" ? "ring-villain/60" : "ring-border",
                      )}
                    >
                      <AvatarImage src={r.uniform.portrait || undefined} alt="" loading="lazy" decoding="async" className="rounded-none" />
                      <AvatarFallback className="rounded-none bg-secondary font-heading text-[0.65rem]">{initials(r.agent.name)}</AvatarFallback>
                    </Avatar>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate font-medium">{r.agent.name}</span>
                      <span className="truncate text-xs text-muted-foreground">{r.uniform.name}</span>
                    </span>
                    <AttributeLabel value={r.uniform.side} className="text-xs text-muted-foreground" />
                    <CheckIcon className={cn(value?.uniform.id === r.uniform.id ? "opacity-100" : "opacity-0")} />
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
