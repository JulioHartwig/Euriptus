import type { NoticiaTipo } from "@prisma/client";
import { type LucideIcon, Megaphone, Newspaper, TrendingUp, Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { NOTICIA_TIPO_BADGE, NOTICIA_TIPO_LABEL } from "@/lib/noticia";
import { cn, formatDateTime } from "@/lib/utils";
import type { NoticiaPublica } from "@/server/repositories/noticia-repository";

const TIPO_ICON: Record<NoticiaTipo, LucideIcon> = {
  MERCADO: TrendingUp,
  EVENTO: Zap,
  AVISO: Megaphone,
};

export function NoticiaLista({
  noticias,
  mostrarInativas = false,
  className,
}: {
  noticias: NoticiaPublica[];
  mostrarInativas?: boolean;
  className?: string;
}) {
  if (noticias.length === 0) {
    return (
      <Card
        className={cn(
          "flex min-h-40 flex-col items-center justify-center border-dashed bg-muted/30 px-6 py-10 text-center",
          className,
        )}
      >
        <Newspaper aria-hidden="true" className="h-8 w-8 text-muted-foreground/50" />
        <p className="mt-3 text-sm font-medium">Nenhuma notícia publicada</p>
        <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
          Quando o professor publicar notícias do mercado, elas aparecerão aqui.
        </p>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <ul className="divide-y">
        {noticias.map((noticia) => {
          const Icon = TIPO_ICON[noticia.tipo];

          return (
            <li key={noticia.id}>
              <article className="p-5 sm:p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={NOTICIA_TIPO_BADGE[noticia.tipo]} className="gap-1">
                    <Icon aria-hidden="true" className="h-3 w-3" />
                    {NOTICIA_TIPO_LABEL[noticia.tipo]}
                  </Badge>
                  <time
                    dateTime={noticia.criadoEm.toISOString()}
                    className="text-xs text-muted-foreground"
                  >
                    {formatDateTime(noticia.criadoEm)}
                  </time>
                  {mostrarInativas && !noticia.ativa && (
                    <Badge variant="outline">Inativa</Badge>
                  )}
                </div>

                <h3 className="mt-3 font-display text-lg font-semibold leading-snug tracking-tight">
                  {noticia.titulo}
                </h3>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                  {noticia.corpo}
                </p>
              </article>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
