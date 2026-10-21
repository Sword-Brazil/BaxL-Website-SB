import type { ComponentProps } from "react";
import { Controller, type Control, type FieldPath, type FieldValues } from "react-hook-form";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PasswordInput, PasswordStrengthMeter } from "./PasswordInput";

/**
 * Campo de texto do shadcn (Field + Input) ligado ao react-hook-form. `type="password"` ganha o
 * botão de mostrar/ocultar; com `strength`, também o medidor de força (senhas novas).
 */
export function TextField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  multiline,
  strength,
  ...inputProps
}: {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  description?: string;
  multiline?: boolean;
  strength?: boolean;
} & Omit<ComponentProps<"input">, "name">) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
          {multiline ? (
            <Textarea
              id={field.name}
              {...field}
              value={field.value ?? ""}
              aria-invalid={fieldState.invalid}
            />
          ) : inputProps.type === "password" ? (
            <PasswordInput
              id={field.name}
              {...inputProps}
              {...field}
              value={field.value ?? ""}
              aria-invalid={fieldState.invalid}
              aria-describedby={strength ? `${field.name}-strength` : undefined}
            />
          ) : (
            <Input id={field.name} {...inputProps} {...field} value={field.value ?? ""} aria-invalid={fieldState.invalid} />
          )}
          {strength && <PasswordStrengthMeter password={String(field.value ?? "")} id={`${field.name}-strength`} />}
          {description && <FieldDescription>{description}</FieldDescription>}
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}
