import { useState } from "react";
import { useGetMarketQuotes, MarketQuoteCategory } from "@workspace/api-client-react";
import { Layout } from "@/components/Layout";
import { Panel, LoadingPanel, ErrorPanel } from "@/components/Panel";
import { Sparkline } from "@/components/Sparkline";
import { ArrowDownRight, ArrowUpRight, Search } from "lucide-react";
import { Link } from "wouter";

const CATEGORIES = [
  { id: "all", label: "ALL ASSETS" },
  { id: "indices", label: "INDICES" },
  { id: "stocks", label: "US STOCKS" },
  { id: "bist", label: "BIST" },
  { id: "etf", label: "ETFs" },
  { id: "commodities", label: "COMMODITIES" },
  { id: "crypto", label: "CRYPTO" },
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
        <Panel className="shrink-0 p-0 overflow-visible">
          <div className="flex items-center justify-between p-2 border-b border-primary/30">
            <div className="flex gap-1 overflow-x-auto custom-scrollbar">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-4 py-1.5 text-xs font-bold whitespace-nowrap transition-colors border ${
                    activeCategory === cat.id 
                      ? 'bg-primary/20 text-primary border-primary' 
                      : 'border-transparent text-muted-foreground hover:text-primary hover:bg-primary/5'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            <div className="relative shrink-0 ml-4 hidden sm:block">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="SEARCH SYMBOL..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-black border border-primary/30 text-primary text-xs px-8 py-1.5 focus:outline-none focus:border-primary w-64 placeholder:text-muted-foreground font-mono uppercase"
              />
            </div>
          </div>
        </Panel>

        <div className="flex-1 min-h-0">
          {isLoading ? (
            <LoadingPanel title="MARKET DATA" />
          ) : error ? (
            <ErrorPanel title="MARKET DATA" error={error} />
          ) : (
            <Panel title={`${activeCategory.toUpperCase()} ASSETS`} className="h-full">
              <div className="overflow-auto h-full">
                <table className="w-full text-left border-collapse text-sm">
                  <thead className="sticky top-0 bg-card z-10 text-muted-foreground text-xs border-b border-primary/30 shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
                    <tr>
                      <th className="py-3 px-2 font-normal w-12 text-center">STAT</th>
                      <th className="py-3 font-normal">SYMBOL</th>
                      <th className="py-3 font-normal">NAME</th>
                      <th className="py-3 font-normal text-right">PRICE</th>
                      <th className="py-3 font-normal text-right">CHG</th>
                      <th className="py-3 font-normal text-right">CHG %</th>
                      <th className="py-3 font-normal text-right">VOL</th>
                      <th className="py-3 font-normal text-center w-32">24H TREND</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary/10 font-mono">
                    {filteredQuotes?.map((q) => {
                      const isPositive = q.change >= 0;
                      const isOpen = q.marketStatus === 'open';
                      
                      return (
                        <tr key={q.symbol} className="hover:bg-primary/5 transition-colors group">
                          <td className="py-2 px-2 text-center">
                            <div className={`w-2 h-2 rounded-full mx-auto ${
                              isOpen ? 'bg-positive animate-pulse-fast' : 
                              q.marketStatus === 'pre' ? 'bg-amber-500' : 'bg-muted-foreground'
                            }`} title={`Market: ${q.marketStatus}`} />
                          </td>
                          <td className="py-2">
                            <Link href={`/market/${q.symbol}`} className="font-bold text-primary group-hover:underline text-base">
                              {q.symbol}
                            </Link>
                            {q.currency && <span className="text-[10px] text-muted-foreground ml-2">{q.currency}</span>}
                          </td>
                          <td className="py-2 text-muted-foreground truncate max-w-[200px] text-xs font-sans uppercase tracking-wider">{q.name}</td>
                          <td className="py-2 text-right">{q.price.toFixed(4)}</td>
                          <td className={`py-2 text-right ${isPositive ? 'text-positive' : 'text-destructive'}`}>
                            {isPositive ? '+' : ''}{q.change.toFixed(2)}
                          </td>
                          <td className={`py-2 text-right ${isPositive ? 'text-positive' : 'text-destructive'}`}>
                            {isPositive ? '+' : ''}{q.changePercent.toFixed(2)}%
                          </td>
                          <td className="py-2 text-right text-muted-foreground">
                            {(q.volume / 1000000).toFixed(2)}M
                          </td>
                          <td className="py-1 px-4 text-center align-middle">
                            {q.sparkline && <Sparkline data={q.sparkline} isPositive={isPositive} height={30} width={100} />}
                          </td>
                        </tr>
                      );
                    })}
                    {filteredQuotes?.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-muted-foreground">
                          NO ASSETS FOUND FOR QUERY "{search}"
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
