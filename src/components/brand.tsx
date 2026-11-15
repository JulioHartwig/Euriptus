import { Coffee } from "lucide-react";

import { cn } from "@/lib/utils";

export function Brand({
  className,
  compact = false,
  inverted = false,
}: {
  className?: string;
  compact?: boolean;
  inverted?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-xl bg-amber-400 text-emerald-950 shadow-sm",
          compact ? "h-9 w-9" : "h-11 w-11",
        )}
      >
        <Coffee aria-hidden="true" className={compact ? "h-5 w-5" : "h-6 w-6"} />
      </span>
      <span className="min-w-0">
        <span
          className={cn(
            "block font-display font-semibold leading-tight tracking-tight",
            compact ? "text-lg" : "text-2xl",
            inverted ? "text-sidebar-foreground" : "text-foreground",
          )}
        >
          Euriptus
        </span>
        {!compact && (
          <span
            className={cn(
              "block text-[0.7rem] font-medium uppercase tracking-[0.18em]",
              inverted ? "text-sidebar-muted" : "text-muted-foreground",
            )}
          >
            Cadeia produtiva do café
          </span>
        )}
      </span>
    </div>
  );
}
