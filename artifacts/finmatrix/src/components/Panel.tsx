import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PanelProps {
  children: ReactNode;
  className?: string;
  title?: string;
  action?: ReactNode;
  noPadding?: boolean;
}

export function Panel({ children, className, title, action, noPadding = false }: PanelProps) {
  return (
    <div className={cn("bg-[var(--bg-surface)] flex flex-col border border-[var(--border)] rounded-[10px] overflow-hidden", className)}>
      {(title || action) && (
        <div className="px-5 pt-5 pb-4 flex justify-between items-center shrink-0">
          {title && (
            <h2 className="text-[12px] font-medium tracking-[0.04em] uppercase text-[var(--text-secondary)]">
              {title}
            </h2>
          )}
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={cn("flex-1 overflow-auto", !noPadding && "p-5 pt-0")}>
        {children}
      </div>
    </div>
  );
}

export function LoadingPanel({ title }: { title?: string }) {
  return (
    <Panel title={title} className="min-h-[200px] flex items-center justify-center">
      <div className="text-[var(--text-muted)] flex flex-col items-center gap-3">
        <div className="w-4 h-4 border-2 border-[var(--text-muted)] border-t-[var(--accent)] rounded-full animate-spin"></div>
        <div className="text-[12px] font-medium tracking-[0.04em] uppercase text-[var(--text-secondary)]">Loading...</div>
      </div>
    </Panel>
  );
}

export function ErrorPanel({ title, error }: { title?: string; error: Error | null }) {
  return (
    <Panel title={title} className="min-h-[200px] border-[var(--border)]">
      <div className="text-[var(--negative)] text-[13px] flex flex-col gap-2 p-4 bg-[rgba(239,68,68,0.05)] rounded-[8px] border border-[rgba(239,68,68,0.2)]">
        <div className="font-semibold flex items-center gap-2">
          System Error
        </div>
        <div className="text-[var(--text-secondary)]">{error?.message || "An unknown error occurred while retrieving data."}</div>
      </div>
    </Panel>
  );
}
