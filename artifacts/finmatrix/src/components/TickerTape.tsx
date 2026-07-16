import { useGetMarketQuotes } from "@workspace/api-client-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Link } from "wouter";

export function TickerTape() {
  const { data: quotes, isLoading } = useGetMarketQuotes();

  if (isLoading || !quotes) {
    return (
      <div className="h-[36px] border-b border-[var(--border)] bg-[var(--bg-surface)] flex items-center px-6 overflow-hidden">
        <div className="text-[var(--text-muted)] text-[12px] font-medium uppercase tracking-[0.04em]">Connecting feed...</div>
      </div>
    );
  }

  // Duplicate quotes to make the scrolling seamless
  const displayQuotes = [...quotes, ...quotes, ...quotes];

  return (
    <div className="h-[36px] border-b border-[var(--border)] bg-[var(--bg-surface)] flex items-center overflow-hidden shrink-0">
      <div className="bg-[var(--bg-surface)] text-[var(--text-secondary)] text-[11px] font-medium px-4 h-full flex items-center border-r border-[var(--border)] shrink-0 z-10 relative uppercase tracking-[0.04em]">
        Market
      </div>
      <div className="flex-1 ticker-wrap relative">
        <div className="ticker-content flex items-center gap-6 pl-6">
          {displayQuotes.map((quote, i) => {
            const isPositive = quote.change > 0;
            const isNegative = quote.change < 0;
            return (
              <Link key={`${quote.symbol}-${i}`} href={`/market/${quote.symbol}`} className="flex items-center gap-2.5 shrink-0 group hover:bg-[var(--bg-elevated)] cursor-pointer px-2 py-1 rounded-[6px] transition-colors">
                <span className="text-[var(--text-secondary)] text-[12px] font-medium">{quote.symbol}</span>
                <span className="text-[var(--text-primary)] text-[12px] tabular-nums font-medium">{quote.price.toFixed(2)}</span>
                <span className={`flex items-center text-[12px] tabular-nums font-medium ${isPositive ? 'text-[var(--positive)]' : isNegative ? 'text-[var(--negative)]' : 'text-[var(--text-muted)]'}`}>
                  {isPositive ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : isNegative ? <ArrowDownRight className="w-3 h-3 mr-0.5" /> : null}
                  {Math.abs(quote.changePercent).toFixed(2)}%
                </span>
                <span className="w-1 h-1 rounded-full bg-[var(--border)] ml-3"></span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
