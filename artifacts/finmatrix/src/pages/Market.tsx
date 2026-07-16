import { useState } from "react";
import { useGetMarketQuotes, MarketQuoteCategory } from "@workspace/api-client-react";
import { Layout } from "@/components/Layout";
import { Panel, LoadingPanel, ErrorPanel } from "@/components/Panel";
import { Sparkline } from "@/components/Sparkline";
import { Search } from "lucide-react";
import { Link } from "wouter";

const CATEGORIES = [
  { id: "all", label: "All Assets" },
  { id: "indices", label: "Indices" },
  { id: "stocks", label: "US Stocks" },
  { id: "bist", label: "BIST" },
  { id: "etf", label: "ETFs" },
  { id: "commodities", label: "Commodities" },
  { id: "crypto", label: "Crypto" },
  { id: "currencies", label: "FX" },
];

export default function Market() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  
  // Use "all" internally for category parameter if "all" is selected, else specific category
  const categoryParam = activeCategory === "all" ? undefined : (activeCategory as MarketQuoteCategory);
  
  const { data: quotes, isLoading, error } = useGetMarketQuotes({ category: categoryParam });

  const filteredQuotes = quotes?.filter(q => 
    q.symbol.toLowerCase().includes(search.toLowerCase()) || 
    q.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <div className="h-full flex flex-col gap-4 max-w-[1600px] mx-auto">
        <Panel className="shrink-0 p-0 overflow-visible border-none bg-transparent">
          <div className="flex items-center justify-between pb-2">
            <div className="flex gap-2 overflow-x-auto custom-scrollbar">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-4 py-1.5 text-[13px] font-medium rounded-[100px] whitespace-nowrap transition-colors ${
                    activeCategory === cat.id 
                      ? 'bg-[var(--accent)] text-white' 
                      : 'bg-[var(--bg-input)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] border border-[var(--border)]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            <div className="relative shrink-0 ml-4 hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input 
                type="text" 
                placeholder="Search symbol..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-primary)] text-[13px] px-9 py-2 rounded-[8px] focus:outline-none focus:border-[var(--text-secondary)] w-[280px] placeholder:text-[var(--text-muted)] transition-colors"
              />
            </div>
          </div>
        </Panel>

        <div className="flex-1 min-h-0">
          {isLoading ? (
            <LoadingPanel title="Market Data" />
          ) : error ? (
            <ErrorPanel title="Market Data Error" error={error} />
          ) : (
            <Panel title={`${CATEGORIES.find(c => c.id === activeCategory)?.label} Assets`} className="h-full" noPadding>
              <div className="overflow-auto h-full">
                <table className="w-full text-left border-collapse text-[13px]">
                  <thead className="sticky top-0 bg-[var(--bg-surface)] z-10 text-[var(--text-muted)] text-[11px] uppercase tracking-[0.04em]">
                    <tr>
                      <th className="py-3 px-4 font-medium border-b border-[var(--border)] w-12 text-center">Stat</th>
                      <th className="py-3 px-4 font-medium border-b border-[var(--border)]">Symbol</th>
                      <th className="py-3 px-4 font-medium border-b border-[var(--border)]">Name</th>
                      <th className="py-3 px-4 font-medium border-b border-[var(--border)] text-right">Price</th>
                      <th className="py-3 px-4 font-medium border-b border-[var(--border)] text-right">Chg</th>
                      <th className="py-3 px-4 font-medium border-b border-[var(--border)] text-right">Chg %</th>
                      <th className="py-3 px-4 font-medium border-b border-[var(--border)] text-right">Vol</th>
                      <th className="py-3 px-4 font-medium border-b border-[var(--border)] text-center w-32">24H Trend</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)]">
                    {filteredQuotes?.map((q) => {
                      const isPositive = q.change >= 0;
                      const isOpen = q.marketStatus === 'open';
                      
                      return (
                        <tr key={q.symbol} className="hover:bg-[var(--bg-elevated)] transition-colors h-[44px]">
                          <td className="py-2 px-4 text-center">
                            <div className={`w-1.5 h-1.5 rounded-full mx-auto ${
                              isOpen ? 'bg-[var(--positive)]' : 
                              q.marketStatus === 'pre' ? 'bg-[#f59e0b]' : 'bg-[var(--text-muted)]'
                            }`} title={`Market: ${q.marketStatus}`} />
                          </td>
                          <td className="py-2 px-4">
                            <Link href={`/market/${q.symbol}`} className="font-semibold text-[var(--text-primary)] hover:text-[var(--accent)] text-[14px]">
                              {q.symbol}
                            </Link>
                            {q.currency && <span className="text-[10px] text-[var(--text-muted)] ml-2 uppercase font-medium">{q.currency}</span>}
                          </td>
                          <td className="py-2 px-4 text-[var(--text-secondary)] truncate max-w-[200px]">{q.name}</td>
                          <td className="py-2 px-4 text-right tabular-nums font-medium text-[var(--text-primary)]">{q.price.toFixed(4)}</td>
                          <td className={`py-2 px-4 text-right tabular-nums font-medium ${isPositive ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
                            {isPositive ? '+' : ''}{q.change.toFixed(2)}
                          </td>
                          <td className={`py-2 px-4 text-right tabular-nums font-medium ${isPositive ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
                            {isPositive ? '+' : ''}{q.changePercent.toFixed(2)}%
                          </td>
                          <td className="py-2 px-4 text-right text-[var(--text-secondary)] tabular-nums">
                            {(q.volume / 1000000).toFixed(2)}M
                          </td>
                          <td className="py-1 px-4 text-center align-middle">
                            {q.sparkline && <Sparkline data={q.sparkline} isPositive={isPositive} height={28} width={100} />}
                          </td>
                        </tr>
                      );
                    })}
                    {filteredQuotes?.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-[var(--text-muted)]">
                          No assets found for query "{search}"
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Panel>
          )}
        </div>
      </div>
    </Layout>
  );
}
