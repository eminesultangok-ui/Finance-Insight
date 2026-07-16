import { useGetEconomicCalendar } from "@workspace/api-client-react";
import { Layout } from "@/components/Layout";
import { Panel, LoadingPanel, ErrorPanel } from "@/components/Panel";
import { format, isToday, isTomorrow, isPast } from "date-fns";

export default function Calendar() {
  const { data: events, isLoading, error } = useGetEconomicCalendar({ days: 7 });

  // Group events by date
  const groupedEvents = events?.reduce((acc, event) => {
    const date = new Date(event.eventDate).toISOString().split('T')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(event);
    return acc;
  }, {} as Record<string, typeof events>);

  const sortedDates = Object.keys(groupedEvents || {}).sort();

  const getDateLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isToday(d)) return "Today";
    if (isTomorrow(d)) return "Tomorrow";
    return format(d, 'EEEE, MMM dd');
  };

  return (
    <Layout>
      <div className="h-full flex flex-col gap-4 max-w-[1000px] mx-auto">
        <div className="flex-1 min-h-0">
          {isLoading ? (
            <LoadingPanel title="Economic Calendar" />
          ) : error ? (
            <ErrorPanel title="Calendar Error" error={error} />
          ) : (
            <Panel title="Global Economic Calendar (7 Day Outlook)" className="h-full">
              <div className="h-full overflow-auto pr-4 custom-scrollbar">
                <div className="flex flex-col gap-10 pb-10">
                  {sortedDates.map(date => (
                    <div key={date} className="relative">
                      {/* Date Header */}
                      <div className="sticky top-0 z-20 bg-[var(--bg-surface)] py-3 border-b border-[var(--border)] mb-4 flex items-center justify-between">
                        <h2 className="text-[14px] font-semibold text-[var(--text-primary)]">{getDateLabel(date)}</h2>
                        <span className="text-[12px] text-[var(--text-muted)] font-medium tabular-nums">{date}</span>
                      </div>

                      {/* Events List */}
                      <div className="flex flex-col gap-3">
                        {groupedEvents?.[date].map(event => {
                          const eventDate = new Date(event.eventDate);
                          const isHigh = event.importance === 'high';
                          const isMed = event.importance === 'medium';
                          const past = isPast(eventDate);
                          
                          return (
                            <div 
                              key={event.id} 
                              className={`flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-[8px] border transition-colors ${
                                past ? 'opacity-60 bg-[var(--bg-base)] border-transparent' : 
                                'bg-[var(--bg-base)] border-[var(--border)] hover:border-[var(--text-muted)]'
                              }`}
                            >
                              <div className="flex items-center gap-4 w-full md:w-[220px] shrink-0">
                                <div className="text-[14px] font-medium text-[var(--text-secondary)] w-14 tabular-nums">{format(eventDate, 'HH:mm')}</div>
                                <div className={`text-[10px] px-2 py-0.5 rounded-[4px] font-bold tracking-[0.04em] w-[60px] text-center ${
                                  isHigh ? 'bg-[rgba(239,68,68,0.1)] text-[var(--negative)]' : 
                                  isMed ? 'bg-[rgba(245,158,11,0.1)] text-[#f59e0b]' : 
                                  'bg-[var(--bg-input)] text-[var(--text-muted)]'
                                }`}>
                                  {event.importance.toUpperCase()}
                                </div>
                                <div className="text-[13px] font-medium text-[var(--text-secondary)] uppercase">{event.country}</div>
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="text-[15px] font-medium text-[var(--text-primary)] truncate">{event.name}</div>
                                {event.description && (
                                  <div className="text-[13px] text-[var(--text-muted)] mt-1 line-clamp-1">{event.description}</div>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-6 w-full md:w-auto shrink-0 text-[13px] tabular-nums">
                                <div className="w-[70px] text-right">
                                  <div className="text-[10px] text-[var(--text-muted)] font-medium tracking-[0.04em] mb-1">ACTUAL</div>
                                  <div className={`font-medium ${event.actual ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                                    {event.actual || '-'}
                                  </div>
                                </div>
                                <div className="w-[70px] text-right">
                                  <div className="text-[10px] text-[var(--text-muted)] font-medium tracking-[0.04em] mb-1">FORECAST</div>
                                  <div className="text-[var(--text-primary)]">{event.forecast || '-'}</div>
                                </div>
                                <div className="w-[70px] text-right">
                                  <div className="text-[10px] text-[var(--text-muted)] font-medium tracking-[0.04em] mb-1">PREVIOUS</div>
                                  <div className="text-[var(--text-secondary)]">{event.previous || '-'}</div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  {sortedDates.length === 0 && (
                    <div className="py-16 text-center text-[var(--text-muted)]">
                      No events scheduled.
                    </div>
                  )}
                </div>
              </div>
            </Panel>
          )}
        </div>
      </div>
    </Layout>
  );
}
