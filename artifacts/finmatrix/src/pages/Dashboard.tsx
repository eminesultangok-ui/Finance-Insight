import { useEffect } from "react";
import { useGetMarketIndices, useGetMarketQuotes, useGetNews, useGetEconomicCalendar, useGetAiMarketSummary } from "@workspace/api-client-react";
import { Layout } from "@/components/Layout";
import { TickerTape } from "@/components/TickerTape";
import { Panel, LoadingPanel, ErrorPanel } from "@/components/Panel";
import { Sparkline } from "@/components/Sparkline";
import { ArrowDownRight, ArrowUpRight, Clock } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: indices, isLoading: indicesLoading, error: indicesError, refetch: refetchIndices } = useGetMarketIndices();
  const { data: quotes, isLoading: quotesLoading, error: quotesError, refetch: refetchQuotes } = useGetMarketQuotes();
  const { data: news, isLoading: newsLoading, refetch: refetchNews } = useGetNews({ limit: 5 });
  const { data: calendar, isLoading: calendarLoading, refetch: refetchCalendar } = useGetEconomicCalendar({ days: 3 });
  const { data: aiSummary, isLoading: aiLoading, refetch: refetchAi } = useGetAiMarketSummary({ type: "morning" });

  useEffect(() => {
    const interval = setInterval(() => {
      refetchIndices();
      refetchQuotes();
      refetchNews();
      refetchCalendar();
      refetchAi();
    }, 30000);
    return () => clearInterval(interval);
  }, [refetchIndices, refetchQuotes, refetchNews, refetchCalendar, refetchAi]);

  return (
    <Layout>
      <div className="absolute inset-x-0 top-0 z-40">
        <TickerTape />
      </div>
      
      <div className="pt-10 h-full flex flex-col gap-4 max-w-[1600px] mx-auto">
        {/* Indices row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
          {indicesLoading ? (
            Array.from({ length: 4 }).map((_, i) => <LoadingPanel key={i} />)
          ) : indicesError ? (
            <ErrorPanel title="INDICES ERROR" error={indicesError} />
          ) : (
            indices?.slice(0, 4).map((idx) => {
              const isPositive = idx.change >= 0;
              return (
                <Panel key={idx.symbol} className="h-28 relative group">
                  <Link href={`/market/${idx.symbol}`} className="absolute inset-0 z-10" />
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-muted-foreground text-xs">{idx.name}</div>
                      <div className="text-xl font-bold">{idx.symbol}</div>
                    </div>
                    <div className={`flex flex-col items-end ${isPositive ? 'text-positive' : 'text-destructive'}`}>
                      <div className="text-xl">{idx.price.toFixed(2)}</div>
                      <div className="flex items-center text-sm font-bold">
                        {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                        {Math.abs(idx.changePercent).toFixed(2)}%
                      </div>
                    </div>
                  </div>
                  <div className="mt-auto h-8 opacity-50 group-hover:opacity-100 transition-opacity">
                    {idx.sparkline && <Sparkline data={idx.sparkline} isPositive={isPositive} />}
                  </div>
                </Panel>
              )
            })
          )}
        </div>

        {/* Main 3-col layout */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">
          {/* Left: Assets Table */}
          <div className="lg:col-span-8 flex flex-col min-h-0">
            {quotesLoading ? (
              <LoadingPanel title="MARKET ASSETS" />
            ) : quotesError ? (
              <ErrorPanel title="ASSETS ERROR" error={quotesError} />
            ) : (
              <Panel title="MARKET ASSETS OVERVIEW" className="flex-1" action={
                <Link href="/market" className="text-xs text-primary hover:underline">VIEW ALL →</Link>
              }>
                <div className="overflow-auto h-full">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead className="sticky top-0 bg-card z-10 text-muted-foreground text-xs border-b border-primary/30">
                      <tr>
                        <th className="py-2 font-normal">SYMBOL</th>
                        <th className="py-2 font-normal">NAME</th>
                        <th className="py-2 font-normal text-right">PRICE</th>
                        <th className="py-2 font-normal text-right">CHG %</th>
                        <th className="py-2 font-normal text-right">VOL</th>
                        <th className="py-2 font-normal text-center w-24">TREND (24H)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-primary/10">
                      {quotes?.slice(0, 15).map((q) => {
                        const isPositive = q.change >= 0;
                        return (
                          <tr key={q.symbol} className="hover:bg-primary/5 transition-colors group">
                            <td className="py-2">
                              <Link href={`/market/${q.symbol}`} className="font-bold text-primary group-hover:underline">
                                {q.symbol}
                              </Link>
                            </td>
                            <td className="py-2 text-muted-foreground truncate max-w-[150px]">{q.name}</td>
                            <td className="py-2 text-right font-mono">{q.price.toFixed(2)}</td>
                            <td className={`py-2 text-right font-mono ${isPositive ? 'text-positive' : 'text-destructive'}`}>
                              {isPositive ? '+' : ''}{q.changePercent.toFixed(2)}%
                            </td>
                            <td className="py-2 text-right text-muted-foreground font-mono">
                              {(q.volume / 1000000).toFixed(1)}M
                            </td>
                            <td className="py-1 px-2 text-center align-middle">
                              {q.sparkline && <Sparkline data={q.sparkline} isPositive={isPositive} height={24} width={80} />}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Panel>
            )}
          </div>

          {/* Right: AI & News */}
          <div className="lg:col-span-4 flex flex-col gap-4 min-h-0">
            {aiLoading ? (
              <LoadingPanel title="AI BRIEFING" />
            ) : (
              <Panel title="AI MARKET BRIEFING" className="shrink-0 max-h-[300px]" action={
                <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {aiSummary?.generatedAt ? new Date(aiSummary.generatedAt).toLocaleTimeString() : ''}
                </div>
              }>
                {aiSummary && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 text-[10px] uppercase font-bold border ${
                        aiSummary.sentiment === 'bullish' ? 'text-positive border-positive/50 bg-positive/10' :
                        aiSummary.sentiment === 'bearish' ? 'text-destructive border-destructive/50 bg-destructive/10' :
                        'text-primary border-primary/50 bg-primary/10'
                      }`}>
                        {aiSummary.sentiment} TREND
                      </span>
                      <span className="text-xs text-muted-foreground uppercase">{aiSummary.type} summary</span>
                    </div>
                    <p className="text-sm leading-relaxed text-foreground/90">{aiSummary.content}</p>
                    {aiSummary.highlights && aiSummary.highlights.length > 0 && (
                      <ul className="text-xs text-muted-foreground flex flex-col gap-1 mt-2">
                        {aiSummary.highlights.map((hl, i) => (
                          <li key={i} className="flex gap-2">
                            <span className="text-primary">›</span> {hl}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </Panel>
            )}

            {newsLoading ? (
              <LoadingPanel title="NEWS FEED" />
            ) : (
              <Panel title="LATEST NEWS" className="flex-1" action={
                <Link href="/news" className="text-xs text-primary hover:underline">ALL NEWS →</Link>
              }>
                <div className="flex flex-col gap-3 h-full overflow-auto pr-2">
                  {news?.articles?.map((article) => (
                    <a key={article.id} href={article.url} target="_blank" rel="noreferrer" className="block border-b border-primary/20 pb-3 last:border-0 hover:bg-primary/5 p-2 -mx-2 rounded transition-colors group">
                      <div className="flex justify-between items-start gap-2 mb-1">
                        <span className="text-[10px] text-primary bg-primary/10 px-1 font-bold">{article.source}</span>
                        <span className="text-[10px] text-muted-foreground">{new Date(article.publishedAt).toLocaleTimeString()}</span>
                      </div>
                      <h4 className="text-sm font-bold leading-tight group-hover:text-primary transition-colors">{article.title}</h4>
                    </a>
                  ))}
                </div>
              </Panel>
            )}
          </div>
        </div>

        {/* Bottom: Calendar */}
        <div className="h-48 shrink-0">
          {calendarLoading ? (
            <LoadingPanel title="ECONOMIC CALENDAR" />
          ) : (
            <Panel title="UPCOMING EVENTS (72H)" action={
              <Link href="/calendar" className="text-xs text-primary hover:underline">FULL CALENDAR →</Link>
            }>
              <div className="flex gap-4 overflow-x-auto h-full pb-2">
                {calendar?.map((event) => {
                  const isHigh = event.importance === 'high';
                  const isMed = event.importance === 'medium';
                  return (
                    <div key={event.id} className={`shrink-0 w-64 border p-3 flex flex-col justify-between ${
                      isHigh ? 'border-destructive/40 bg-destructive/5' : 
                      isMed ? 'border-amber-500/40 bg-amber-500/5' : 
                      'border-primary/20 bg-primary/5'
                    }`}>
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-bold text-muted-foreground">{event.country}</span>
                          <span className={`text-[10px] px-1 font-bold ${
                            isHigh ? 'bg-destructive text-destructive-foreground' : 
                            isMed ? 'bg-amber-500 text-black' : 
                            'bg-primary/20 text-primary'
                          }`}>{event.importance.toUpperCase()}</span>
                        </div>
                        <div className="text-sm font-bold leading-tight mb-2 truncate" title={event.name}>{event.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(event.eventDate).toLocaleString(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <div className="flex justify-between text-xs mt-2 border-t border-primary/20 pt-2 font-mono">
                        <div>
                          <div className="text-[10px] text-muted-foreground">ACT/FCST</div>
                          <div className={event.actual ? 'text-primary' : 'text-muted-foreground'}>
                            {event.actual || event.forecast || '-'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-muted-foreground">PREV</div>
                          <div>{event.previous || '-'}</div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Panel>
          )}
        </div>
      </div>
    </Layout>
  );
}
