import type * as React from "react"
import { Loader2Icon } from "lucide-react"
import { cn } from "cn"

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return <Loader2Icon role="status" aria-hidden data-slot="spinner" className={cn("size-4 animate-spin", className)} {...props} />
}

export { Spinner }
