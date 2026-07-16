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
    return <Layout><ErrorPanel title="Symbol Error" error={detailError} /></Layout>;
  }

  return (
    <Layout>
      <div className="h-full flex flex-col gap-4 max-w-[1600px] mx-auto">
        {detailLoading ? (
          <LoadingPanel title="Loading Symbol..." />
        ) : detail && (
          <>
            {/* Header Block */}
            <div className="flex flex-col lg:flex-row gap-4 shrink-0">
              <Panel className="flex-1">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div>
                    <h1 className="text-[32px] font-bold text-[var(--text-primary)] leading-none mb-2">{detail.symbol}</h1>
                    <div className="text-[15px] text-[var(--text-secondary)] font-medium">{detail.name}</div>
                    <div className="flex items-center gap-3 mt-3 text-[12px] text-[var(--text-muted)] font-medium uppercase tracking-[0.04em]">
                      {detail.sector && <span>{detail.sector}</span>}
                      {detail.sector && detail.industry && <span className="w-1 h-1 rounded-full bg-[var(--text-muted)]"></span>}
                      {detail.industry && <span>{detail.industry}</span>}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-[32px] font-bold text-[var(--text-primary)] tabular-nums leading-none mb-2">
                      {detail.price.toFixed(2)}
                    </div>
                    <div className={`text-[18px] font-medium tabular-nums flex items-center justify-end gap-1 ${isPositive ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
                      {isPositive ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                      {Math.abs(detail.change).toFixed(2)} ({Math.abs(detail.changePercent).toFixed(2)}%)
                    </div>
                  </div>
                </div>
              </Panel>

              {/* Key Stats Grid */}
              <Panel className="w-full lg:w-[450px]">
                <div className="grid grid-cols-3 gap-x-6 gap-y-4">
                  <div>
                    <div className="text-[11px] font-medium text-[var(--text-secondary)] uppercase tracking-[0.04em] mb-1">Market Cap</div>
                    <div className="text-[16px] text-[var(--text-primary)] tabular-nums font-medium">{detail.marketCap ? `$${(detail.marketCap / 1e9).toFixed(2)}B` : 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-[11px] font-medium text-[var(--text-secondary)] uppercase tracking-[0.04em] mb-1">P/E Ratio</div>
                    <div className="text-[16px] text-[var(--text-primary)] tabular-nums font-medium">{detail.peRatio ? detail.peRatio.toFixed(2) : 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-[11px] font-medium text-[var(--text-secondary)] uppercase tracking-[0.04em] mb-1">Revenue</div>
                    <div className="text-[16px] text-[var(--text-primary)] tabular-nums font-medium">{detail.revenue ? `$${(detail.revenue / 1e9).toFixed(2)}B` : 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-[11px] font-medium text-[var(--text-secondary)] uppercase tracking-[0.04em] mb-1">EPS</div>
                    <div className="text-[16px] text-[var(--text-primary)] tabular-nums font-medium">{detail.eps ? detail.eps.toFixed(2) : 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-[11px] font-medium text-[var(--text-secondary)] uppercase tracking-[0.04em] mb-1">Div Yield</div>
                    <div className="text-[16px] text-[var(--text-primary)] tabular-nums font-medium">{detail.dividendYield ? `${(detail.dividendYield * 100).toFixed(2)}%` : 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-[11px] font-medium text-[var(--text-secondary)] uppercase tracking-[0.04em] mb-1">Debt/Equity</div>
                    <div className="text-[16px] text-[var(--text-primary)] tabular-nums font-medium">{detail.debtToEquity ? detail.debtToEquity.toFixed(2) : 'N/A'}</div>
                  </div>
                </div>
              </Panel>
            </div>

            {/* Main Content */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">
              
              {/* Chart */}
              <Panel title={`${detail.symbol} Price History`} className="lg:col-span-8 flex flex-col min-h-[400px]" action={
                <div className="flex gap-1 bg-[var(--bg-input)] p-1 rounded-[8px] border border-[var(--border)]">
                  {PERIODS.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setPeriod(p.id)}
                      className={`px-3 py-1 text-[11px] font-semibold rounded-[4px] transition-colors ${
                        period === p.id 
                        ? 'bg-[var(--accent)] text-white' 
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              }>
                {historyLoading ? (
                  <div className="flex-1 flex items-center justify-center">
                     <div className="w-6 h-6 border-2 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin"></div>
                  </div>
                ) : chartData.length > 0 ? (
                  <div className="flex-1 w-full h-full relative mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.06}/>
                            <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                        <XAxis 
                          dataKey="dateFormatted" 
                          stroke="var(--text-muted)" 
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                          minTickGap={30}
                          tick={{fill: 'var(--text-muted)'}}
                        />
                        <YAxis 
                          domain={[minPrice - domainPadding, maxPrice + domainPadding]} 
                          stroke="var(--text-muted)" 
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(val) => val.toFixed(2)}
                          tick={{fill: 'var(--text-muted)'}}
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '13px' }}
                          itemStyle={{ color: 'var(--accent)', fontWeight: 500 }}
                          labelStyle={{ color: 'var(--text-secondary)', marginBottom: '4px' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="close" 
                          stroke="var(--accent)" 
                          fillOpacity={1} 
                          fill="url(#colorPrice)" 
                          strokeWidth={2}
                          isAnimationActive={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-[var(--text-muted)] text-[13px]">No chart data available for this period.</div>
                )}
              </Panel>

              {/* Company Info & News */}
              <div className="lg:col-span-4 flex flex-col gap-4 min-h-0">
                <Panel title="Company Profile" className="shrink-0">
                  <p className="text-[14px] leading-[1.7] text-[var(--text-secondary)] mb-4 line-clamp-6">
                    {detail.description || "No description available."}
                  </p>
                  <div className="flex flex-col gap-3 text-[13px] border-t border-[var(--border-subtle)] pt-4">
                    {detail.country && (
                      <div className="flex items-center gap-3 text-[var(--text-primary)]">
                        <Globe className="w-4 h-4 text-[var(--text-muted)]" /> {detail.country}
                      </div>
                    )}
                    {detail.employees && (
                      <div className="flex items-center gap-3 text-[var(--text-primary)] tabular-nums">
                        <Users className="w-4 h-4 text-[var(--text-muted)]" /> {detail.employees.toLocaleString()} Employees
                      </div>
                    )}
                    {detail.website && (
                      <div className="flex items-center gap-3 text-[var(--text-primary)]">
                        <Building2 className="w-4 h-4 text-[var(--text-muted)]" /> 
                        <a href={detail.website} target="_blank" rel="noreferrer" className="text-[var(--accent)] hover:underline truncate">
                          {detail.website.replace(/^https?:\/\/(www\.)?/, '')}
                        </a>
                      </div>
                    )}
                  </div>
                </Panel>

                <Panel title="Related News" className="flex-1" noPadding>
                  {newsLoading ? (
                    <div className="flex justify-center p-8">
                       <div className="w-4 h-4 border-2 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin"></div>
                    </div>
                  ) : (
                    <div className="flex flex-col h-full overflow-auto">
                      {(detail.news || news?.articles)?.slice(0, 5).map((article) => (
                        <a key={article.id} href={article.url} target="_blank" rel="noreferrer" className="block border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--bg-elevated)] p-4 transition-colors group">
                          <div className="flex justify-between items-start gap-2 mb-2">
                            <span className="text-[11px] font-medium tracking-[0.04em] text-[var(--text-muted)] uppercase">{article.source}</span>
                            <span className="text-[11px] text-[var(--text-muted)] tabular-nums">{format(new Date(article.publishedAt), 'MM/dd HH:mm')}</span>
                          </div>
                          <h4 className="text-[14px] font-medium leading-[1.4] text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">{article.title}</h4>
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
