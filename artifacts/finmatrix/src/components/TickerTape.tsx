import { useGetMarketQuotes } from "@workspace/api-client-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Link } from "wouter";

export function TickerTape() {
  const { data: quotes, isLoading } = useGetMarketQuotes();

  if (isLoading || !quotes) {
    return (
      <div className="h-8 border-b border-primary/30 bg-black flex items-center px-4 overflow-hidden">
        <div className="text-primary text-xs tracking-widest animate-pulse">INITIALIZING FEED...</div>
      </div>
    );
  }

  // Duplicate quotes to make the scrolling seamless if needed
  const displayQuotes = [...quotes, ...quotes];

  return (
    <div className="h-8 border-b border-primary/30 bg-black flex items-center overflow-hidden shrink-0">
      <div className="bg-primary/20 text-primary text-xs font-bold px-3 h-full flex items-center border-r border-primary/30 shrink-0 z-10 relative shadow-[2px_0_10px_rgba(0,0,0,0.5)]">
        LIVE
      </div>
      <div className="flex-1 ticker-wrap relative">
        <div className="ticker-content flex items-center gap-8 pl-8">
          {displayQuotes.map((quote, i) => {
            const isPositive = quote.change >= 0;
            return (
              <Link key={`${quote.symbol}-${i}`} href={`/market/${quote.symbol}`} className="flex items-center gap-3 shrink-0 group hover:bg-white/5 cursor-pointer px-2 rounded transition-colors">
                <span className="text-foreground font-bold">{quote.symbol}</span>
                <span className="text-muted-foreground">{quote.price.toFixed(2)}</span>
                <span className={`flex items-center text-xs ${isPositive ? 'text-positive' : 'text-destructive'}`}>
                  {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {Math.abs(quote.changePercent).toFixed(2)}%
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
