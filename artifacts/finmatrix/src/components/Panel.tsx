import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PanelProps {
  children: ReactNode;
  className?: string;
  title?: string;
  action?: ReactNode;
}

export function Panel({ children, className, title, action }: PanelProps) {
  return (
    <div className={cn("terminal-panel bg-card text-card-foreground flex flex-col border border-primary/30", className)}>
      {(title || action) && (
        <div className="border-b border-primary/30 bg-primary/5 px-3 py-1.5 flex justify-between items-center shrink-0">
          {title && (
            <h2 className="text-primary text-xs font-bold uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-primary inline-block"></span>
              {title}
            </h2>
          )}
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-3 flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}

export function LoadingPanel({ title }: { title?: string }) {
  return (
    <Panel title={title} className="min-h-[200px] flex items-center justify-center">
      <div className="text-primary flex flex-col items-center gap-4">
        <div className="text-2xl animate-pulse">■ ■ ■</div>
        <div className="text-xs tracking-widest uppercase">FETCHING DATA...</div>
      </div>
    </Panel>
  );
}

export function ErrorPanel({ title, error }: { title?: string; error: Error | null }) {
  return (
    <Panel title={title} className="min-h-[200px] border-destructive/50">
      <div className="text-destructive font-mono text-xs flex flex-col gap-2 p-4 bg-destructive/10">
        <div className="font-bold flex items-center gap-2">
          <span className="text-lg">⚠</span> SYSTEM ERROR
        </div>
        <div>{error?.message || "An unknown error occurred while retrieving data."}</div>
      </div>
    </Panel>
  );
}
