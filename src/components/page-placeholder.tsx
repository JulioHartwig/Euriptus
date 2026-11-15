import type { LucideIcon } from "lucide-react";
import { ArrowRight, Construction } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";

export function PagePlaceholder({
  title,
  description,
  icon: Icon,
  upcoming,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  upcoming: string[];
}) {
  return (
    <div className="space-y-6">
      <div className="max-w-2xl">
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Em construção
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {title}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
          {description}
        </p>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="flex-row items-start gap-4 space-y-0 border-b bg-muted/40">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Icon aria-hidden="true" className="h-5 w-5" />
          </span>
          <div className="space-y-1">
            <h2 className="flex flex-wrap items-center gap-2 text-lg font-semibold leading-none tracking-tight">
              Disponível em uma próxima iteração
              <Badge variant="accent" className="gap-1">
                <Construction aria-hidden="true" className="h-3 w-3" />
                Planejado
              </Badge>
            </h2>
            <CardDescription>
              Esta área já faz parte da navegação, mas ainda não possui funcionalidades.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <h3 className="text-sm font-semibold">O que virá aqui</h3>
          <ul className="mt-3 space-y-2.5">
            {upcoming.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                <ArrowRight
                  aria-hidden="true"
                  className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                />
                {item}
              </li>
            ))}
          </ul>
          <Link
            href="/painel"
            className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Voltar ao painel
            <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
