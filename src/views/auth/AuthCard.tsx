import type { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export function AuthCard({ title, subtitle, footer, children }: { title: string; subtitle?: string; footer?: ReactNode; children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-md">
      <Card variant="panel">
        <CardHeader>
          <CardTitle className="text-2xl">{title}</CardTitle>
          {subtitle && <CardDescription>{subtitle}</CardDescription>}
        </CardHeader>
        <CardContent>{children}</CardContent>
        {footer && <CardFooter className="flex flex-wrap justify-between gap-2 text-sm">{footer}</CardFooter>}
      </Card>
    </div>
  );
}
