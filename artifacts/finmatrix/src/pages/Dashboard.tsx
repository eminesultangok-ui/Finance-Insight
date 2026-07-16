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
      
      <div className="pt-14 h-full flex flex-col gap-4 max-w-[1600px] mx-auto">
        {/* Indices row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
          {indicesLoading ? (
            Array.from({ length: 4 }).map((_, i) => <LoadingPanel key={i} />)
          ) : indicesError ? (
            <ErrorPanel title="Indices Error" error={indicesError} />
          ) : (
            indices?.slice(0, 4).map((idx) => {
              const isPositive = idx.change >= 0;
              return (
                <Panel key={idx.symbol} className="h-[120px] relative group hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer">
                  <Link href={`/market/${idx.symbol}`} className="absolute inset-0 z-10" />
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-[11px] font-medium tracking-[0.06em] text-[var(--text-secondary)] uppercase">{idx.name}</div>
                      <div className="text-[14px] text-[var(--text-primary)] font-semibold mt-0.5">{idx.symbol}</div>
                    </div>
                    <div className={`flex flex-col items-end ${isPositive ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
                      <div className="text-[22px] font-medium tabular-nums leading-none">{idx.price.toFixed(2)}</div>
                      <div className="flex items-center text-[13px] font-medium mt-1">
                        {isPositive ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
                        {Math.abs(idx.changePercent).toFixed(2)}%
                      </div>
                    </div>
                  </div>
                  <div className="mt-auto h-[40px] opacity-70 group-hover:opacity-100 transition-opacity">
                    {idx.sparkline && <Sparkline data={idx.sparkline} isPositive={isPositive} height="100%" />}
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
              <LoadingPanel title="Market Assets" />
            ) : quotesError ? (
              <ErrorPanel title="Assets Error" error={quotesError} />
            ) : (
              <Panel title="Market Assets Overview" className="flex-1" noPadding action={
                <Link href="/market" className="text-[12px] font-medium text-[var(--accent)] hover:text-[var(--text-primary)] transition-colors pr-5 pt-5">View All →</Link>
              }>
                <div className="overflow-auto h-full">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-[var(--bg-surface)] z-10 text-[var(--text-muted)] text-[11px] uppercase tracking-[0.04em]">
                      <tr>
                        <th className="py-3 px-5 font-medium border-b border-[var(--border)]">Symbol</th>
                        <th className="py-3 px-5 font-medium border-b border-[var(--border)]">Name</th>
                        <th className="py-3 px-5 font-medium border-b border-[var(--border)] text-right">Price</th>
                        <th className="py-3 px-5 font-medium border-b border-[var(--border)] text-right">Chg %</th>
                        <th className="py-3 px-5 font-medium border-b border-[var(--border)] text-right">Vol</th>
                        <th className="py-3 px-5 font-medium border-b border-[var(--border)] text-center w-[100px]">Trend</th>
                      </tr>
                    </thead>
                    <tbody className="text-[13px]">
                      {quotes?.slice(0, 15).map((q) => {
                        const isPositive = q.change >= 0;
                        return (
                          <tr key={q.symbol} className="hover:bg-[var(--bg-elevated)] transition-colors border-b border-[var(--border-subtle)] last:border-0 h-[44px]">
                            <td className="py-2 px-5">
                              <Link href={`/market/${q.symbol}`} className="font-semibold text-[var(--accent)] hover:underline">
                                {q.symbol}
                              </Link>
                            </td>
                            <td className="py-2 px-5 text-[var(--text-secondary)] truncate max-w-[150px]">{q.name}</td>
                            <td className="py-2 px-5 text-right tabular-nums text-[var(--text-primary)] font-medium">{q.price.toFixed(2)}</td>
                            <td className={`py-2 px-5 text-right tabular-nums font-medium ${isPositive ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
                              {isPositive ? '+' : ''}{q.changePercent.toFixed(2)}%
                            </td>
                            <td className="py-2 px-5 text-right text-[var(--text-muted)] tabular-nums">
                              {(q.volume / 1000000).toFixed(1)}M
                            </td>
                            <td className="py-1 px-5 text-center align-middle">
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
              <LoadingPanel title="AI Briefing" />
            ) : (
              <Panel title="AI Market Briefing" className="shrink-0 max-h-[300px]" action={
                <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-1.5 pt-5 pr-5">
                  <Clock className="w-3.5 h-3.5" />
                  {aiSummary?.generatedAt ? new Date(aiSummary.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </div>
              }>
                {aiSummary && (
                  <div className="flex flex-col gap-3 pt-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded-[6px] text-[10px] uppercase font-bold tracking-[0.04em] ${
                        aiSummary.sentiment === 'bullish' ? 'text-[var(--positive)] bg-[rgba(34,197,94,0.1)]' :
                        aiSummary.sentiment === 'bearish' ? 'text-[var(--negative)] bg-[rgba(239,68,68,0.1)]' :
                        'text-[var(--text-secondary)] bg-[var(--bg-input)]'
                      }`}>
                        {aiSummary.sentiment} TREND
                      </span>
                      <span className="text-[11px] text-[var(--text-muted)] uppercase tracking-[0.04em]">{aiSummary.type} summary</span>
                    </div>
                    <p className="text-[14px] leading-[1.6] text-[var(--text-primary)]">{aiSummary.content}</p>
                    {aiSummary.highlights && aiSummary.highlights.length > 0 && (
                      <ul className="text-[13px] text-[var(--text-secondary)] flex flex-col gap-2 mt-3">
                        {aiSummary.highlights.map((hl, i) => (
                          <li key={i} className="flex gap-2.5 items-start">
                            <span className="w-1 h-3.5 bg-[var(--accent)] rounded-[1px] shrink-0 mt-1"></span>
                            <span>{hl}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </Panel>
            )}

            {newsLoading ? (
              <LoadingPanel title="News Feed" />
            ) : (
              <Panel title="Latest News" className="flex-1" noPadding action={
                <Link href="/news" className="text-[12px] font-medium text-[var(--accent)] hover:text-[var(--text-primary)] transition-colors pr-5 pt-5">All News →</Link>
              }>
                <div className="flex flex-col h-full overflow-auto">
                  {news?.articles?.map((article) => (
                    <a key={article.id} href={article.url} target="_blank" rel="noreferrer" className="block border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--bg-elevated)] p-4 transition-colors group">
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <span className="text-[11px] text-[var(--text-muted)] font-medium uppercase tracking-[0.04em]">{article.source}</span>
                        <span className="text-[11px] text-[var(--text-muted)]">{new Date(article.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <h4 className="text-[14px] font-medium leading-[1.4] text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">{article.title}</h4>
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
            <LoadingPanel title="Economic Calendar" />
          ) : (
            <Panel title="Upcoming Events (72H)" action={
              <Link href="/calendar" className="text-[12px] font-medium text-[var(--accent)] hover:text-[var(--text-primary)] transition-colors">Full Calendar →</Link>
            }>
              <div className="flex gap-4 overflow-x-auto h-full pb-2 custom-scrollbar">
                {calendar?.map((event) => {
                  const isHigh = event.importance === 'high';
                  const isMed = event.importance === 'medium';
                  return (
                    <div key={event.id} className="shrink-0 w-64 border border-[var(--border)] rounded-[8px] p-4 flex flex-col justify-between bg-[var(--bg-base)]">
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-[11px] font-medium tracking-[0.04em] text-[var(--text-secondary)]">{event.country}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-[4px] font-bold tracking-[0.04em] ${
                            isHigh ? 'bg-[rgba(239,68,68,0.1)] text-[var(--negative)]' : 
                            isMed ? 'bg-[rgba(245,158,11,0.1)] text-[#f59e0b]' : 
                            'bg-[var(--bg-input)] text-[var(--text-muted)]'
                          }`}>{event.importance.toUpperCase()}</span>
                        </div>
                        <div className="text-[14px] font-medium text-[var(--text-primary)] leading-tight mb-1 truncate" title={event.name}>{event.name}</div>
                        <div className="text-[12px] text-[var(--text-muted)]">
                          {new Date(event.eventDate).toLocaleString(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <div className="flex justify-between text-[12px] mt-4 border-t border-[var(--border-subtle)] pt-3 tabular-nums">
                        <div>
                          <div className="text-[10px] text-[var(--text-muted)] font-medium tracking-[0.04em]">ACT/FCST</div>
                          <div className={event.actual ? 'text-[var(--text-primary)] font-medium' : 'text-[var(--text-secondary)]'}>
                            {event.actual || event.forecast || '-'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-[var(--text-muted)] font-medium tracking-[0.04em]">PREV</div>
                          <div className="text-[var(--text-secondary)]">{event.previous || '-'}</div>
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
