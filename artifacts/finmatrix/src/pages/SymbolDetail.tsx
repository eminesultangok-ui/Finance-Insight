import { useState, useMemo } from "react";
import { useParams } from "wouter";
import { useGetCompanyDetail, useGetMarketHistory, useGetNews } from "@workspace/api-client-react";
import { Layout } from "@/components/Layout";
import { Panel, LoadingPanel, ErrorPanel } from "@/components/Panel";
import { ArrowDownRight, ArrowUpRight, Building2, Globe, Users } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { format } from "date-fns";

const PERIODS = [
  { id: "1d", label: "1D", interval: "5m" },
  { id: "5d", label: "5D", interval: "15m" },
  { id: "1mo", label: "1M", interval: "1h" },
  { id: "3mo", label: "3M", interval: "1d" },
  { id: "6mo", label: "6M", interval: "1d" },
  { id: "1y", label: "1Y", interval: "1wk" },
] as const;

export default function SymbolDetail() {
  const { symbol } = useParams<{ symbol: string }>();
  const [period, setPeriod] = useState<typeof PERIODS[number]["id"]>("1mo");
  
  const selectedPeriodObj = PERIODS.find(p => p.id === period) || PERIODS[2];
  
  const { data: detail, isLoading: detailLoading, error: detailError } = useGetCompanyDetail(symbol || "", { 
    query: { enabled: !!symbol } 
  });
  
  const { data: history, isLoading: historyLoading } = useGetMarketHistory({ 
    symbol: symbol || "",
    period,
    interval: selectedPeriodObj.interval as any
  }, {
    query: { enabled: !!symbol }
  });

  const { data: news, isLoading: newsLoading } = useGetNews({ 
    category: "company_news",
    limit: 10
  });

  const isPositive = detail && detail.change >= 0;

  // Format history for recharts
  const chartData = useMemo(() => {
    if (!history) return [];
    return history.map(h => ({
      ...h,
      dateFormatted: period === '1d' || period === '5d' 
        ? format(new Date(h.timestamp), 'HH:mm')
        : format(new Date(h.timestamp), 'MMM dd')
    }));
  }, [history, period]);

  const minPrice = chartData.length ? Math.min(...chartData.map(d => d.low)) : 0;
  const maxPrice = chartData.length ? Math.max(...chartData.map(d => d.high)) : 100;
  const domainPadding = (maxPrice - minPrice) * 0.1;

  if (detailError) {
    return <Layout><ErrorPanel title="SYMBOL ERROR" error={detailError} /></Layout>;
  }

  return (
    <Layout>
      <div className="h-full flex flex-col gap-4 max-w-[1600px] mx-auto">
        {detailLoading ? (
          <LoadingPanel title="LOADING SYMBOL..." />
        ) : detail && (
          <>
            {/* Header Block */}
            <div className="flex flex-col lg:flex-row gap-4 shrink-0">
              <Panel className="flex-1">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div>
                    <h1 className="text-4xl font-bold text-primary tracking-tighter">{detail.symbol}</h1>
                    <div className="text-lg text-muted-foreground font-sans uppercase tracking-wider">{detail.name}</div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground uppercase">
                      {detail.sector && <span>{detail.sector}</span>}
                      {detail.sector && detail.industry && <span>•</span>}
                      {detail.industry && <span>{detail.industry}</span>}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-5xl font-mono font-bold tracking-tighter text-white">
                      {detail.price.toFixed(2)}
                    </div>
                    <div className={`text-xl font-mono font-bold flex items-center justify-end gap-2 mt-1 ${isPositive ? 'text-positive' : 'text-destructive'}`}>
                      {isPositive ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                      {Math.abs(detail.change).toFixed(2)} ({Math.abs(detail.changePercent).toFixed(2)}%)
                    </div>
                  </div>
                </div>
              </Panel>

              {/* Key Stats Grid */}
              <Panel className="w-full lg:w-[400px]">
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase">Market Cap</div>
                    <div className="font-mono">{detail.marketCap ? `$${(detail.marketCap / 1e9).toFixed(2)}B` : 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase">P/E Ratio</div>
                    <div className="font-mono">{detail.peRatio ? detail.peRatio.toFixed(2) : 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase">Revenue</div>
                    <div className="font-mono">{detail.revenue ? `$${(detail.revenue / 1e9).toFixed(2)}B` : 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase">EPS</div>
                    <div className="font-mono">{detail.eps ? detail.eps.toFixed(2) : 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase">Div Yield</div>
                    <div className="font-mono">{detail.dividendYield ? `${(detail.dividendYield * 100).toFixed(2)}%` : 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase">Debt/Equity</div>
                    <div className="font-mono">{detail.debtToEquity ? detail.debtToEquity.toFixed(2) : 'N/A'}</div>
                  </div>
                </div>
              </Panel>
            </div>

            {/* Main Content */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">
              
              {/* Chart */}
              <Panel title={`${detail.symbol} PRICE HISTORY`} className="lg:col-span-8 flex flex-col min-h-[400px]" action={
                <div className="flex gap-1 bg-black p-0.5 border border-primary/20">
                  {PERIODS.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setPeriod(p.id)}
                      className={`px-2 py-0.5 text-[10px] font-bold ${period === p.id ? 'bg-primary text-black' : 'text-primary hover:bg-primary/20'}`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              }>
                {historyLoading ? (
                  <div className="flex-1 flex items-center justify-center text-primary animate-pulse font-mono">LOADING CHART...</div>
                ) : chartData.length > 0 ? (
                  <div className="flex-1 w-full h-full relative font-mono">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={isPositive ? "hsl(var(--positive))" : "hsl(var(--destructive))"} stopOpacity={0.3}/>
                            <stop offset="95%" stopColor={isPositive ? "hsl(var(--positive))" : "hsl(var(--destructive))"} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--primary) / 0.1)" vertical={false} />
                        <XAxis 
                          dataKey="dateFormatted" 
                          stroke="hsl(var(--muted-foreground))" 
                          fontSize={10}
                          tickLine={false}
                          axisLine={false}
                          minTickGap={30}
                        />
                        <YAxis 
                          domain={[minPrice - domainPadding, maxPrice + domainPadding]} 
                          stroke="hsl(var(--muted-foreground))" 
                          fontSize={10}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(val) => val.toFixed(2)}
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'black', border: '1px solid hsl(var(--primary))', borderRadius: 0, color: 'white' }}
                          itemStyle={{ color: isPositive ? 'hsl(var(--positive))' : 'hsl(var(--destructive))' }}
                          labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="close" 
                          stroke={isPositive ? "hsl(var(--positive))" : "hsl(var(--destructive))"} 
                          fillOpacity={1} 
                          fill="url(#colorPrice)" 
                          strokeWidth={2}
                          isAnimationActive={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground font-mono">NO CHART DATA AVAILABLE</div>
                )}
              </Panel>

              {/* Company Info & News */}
              <div className="lg:col-span-4 flex flex-col gap-4 min-h-0">
                <Panel title="COMPANY PROFILE" className="shrink-0">
                  <p className="text-sm leading-relaxed text-muted-foreground mb-4 line-clamp-6">
                    {detail.description || "No description available."}
                  </p>
                  <div className="flex flex-col gap-2 text-xs">
                    {detail.country && (
                      <div className="flex items-center gap-2 text-foreground">
                        <Globe className="w-3 h-3 text-primary" /> {detail.country}
                      </div>
                    )}
                    {detail.employees && (
                      <div className="flex items-center gap-2 text-foreground">
                        <Users className="w-3 h-3 text-primary" /> {detail.employees.toLocaleString()} EMPLOYEES
                      </div>
                    )}
                    {detail.website && (
                      <div className="flex items-center gap-2 text-foreground">
                        <Building2 className="w-3 h-3 text-primary" /> 
                        <a href={detail.website} target="_blank" rel="noreferrer" className="text-primary hover:underline truncate">
                          {detail.website.replace(/^https?:\/\/(www\.)?/, '')}
                        </a>
                      </div>
                    )}
                  </div>
                </Panel>

                <Panel title="RELATED NEWS" className="flex-1">
                  {newsLoading ? (
                    <div className="text-primary animate-pulse text-xs">FETCHING NEWS...</div>
                  ) : (
                    <div className="flex flex-col gap-3 h-full overflow-auto pr-2">
                      {(detail.news || news?.articles)?.slice(0, 5).map((article) => (
                        <a key={article.id} href={article.url} target="_blank" rel="noreferrer" className="block border-b border-primary/20 pb-3 last:border-0 hover:bg-primary/5 p-2 -mx-2 rounded transition-colors group">
                          <div className="flex justify-between items-start gap-2 mb-1">
                            <span className="text-[10px] text-primary bg-primary/10 px-1 font-bold">{article.source}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">{format(new Date(article.publishedAt), 'MM/dd HH:mm')}</span>
                          </div>
                          <h4 className="text-sm font-bold leading-tight group-hover:text-primary transition-colors">{article.title}</h4>
                        </a>
                      ))}
                    </div>
                  )}
                </Panel>
              </div>

            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
