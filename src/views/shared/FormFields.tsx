import type { ComponentProps } from "react";
import { Controller, type Control, type FieldPath, type FieldValues } from "react-hook-form";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

/** Campo de texto do shadcn (Field + Input) ligado ao react-hook-form. */
export function TextField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  multiline,
  ...inputProps
}: {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  description?: string;
  multiline?: boolean;
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
          ) : (
            <Input id={field.name} {...inputProps} {...field} value={field.value ?? ""} aria-invalid={fieldState.invalid} />
          )}
          {description && <FieldDescription>{description}</FieldDescription>}
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}
