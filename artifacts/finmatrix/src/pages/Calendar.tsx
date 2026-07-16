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
    if (isToday(d)) return "TODAY";
    if (isTomorrow(d)) return "TOMORROW";
    return format(d, 'EEEE, MMM dd').toUpperCase();
  };

  return (
    <Layout>
      <div className="h-full flex flex-col gap-4 max-w-[1200px] mx-auto">
        <div className="flex-1 min-h-0">
          {isLoading ? (
            <LoadingPanel title="ECONOMIC CALENDAR" />
          ) : error ? (
            <ErrorPanel title="CALENDAR ERROR" error={error} />
          ) : (
            <Panel title="GLOBAL ECONOMIC CALENDAR (7 DAY OUTLOOK)" className="h-full">
              <div className="h-full overflow-auto pr-4">
                <div className="flex flex-col gap-8 pb-10">
                  {sortedDates.map(date => (
                    <div key={date} className="relative">
                      {/* Date Header */}
                      <div className="sticky top-0 z-20 bg-card py-2 border-b-2 border-primary/50 mb-4 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white tracking-wider">{getDateLabel(date)}</h2>
                        <span className="font-mono text-muted-foreground">{date}</span>
                      </div>

                      {/* Events List */}
                      <div className="flex flex-col gap-2">
                        {groupedEvents?.[date].map(event => {
                          const eventDate = new Date(event.eventDate);
                          const isHigh = event.importance === 'high';
                          const isMed = event.importance === 'medium';
                          const past = isPast(eventDate);
                          
                          return (
                            <div 
                              key={event.id} 
                              className={`flex flex-col md:flex-row md:items-center gap-4 p-3 border transition-colors ${
                                past ? 'opacity-50 hover:opacity-100 bg-transparent border-primary/10' : 
                                isHigh ? 'bg-destructive/5 border-destructive/30 hover:border-destructive/60' : 
                                isMed ? 'bg-amber-500/5 border-amber-500/30 hover:border-amber-500/60' : 
                                'bg-primary/5 border-primary/20 hover:border-primary/50'
                              }`}
                            >
                              <div className="flex items-center gap-4 w-full md:w-48 shrink-0 font-mono">
                                <div className="text-lg font-bold text-primary w-16">{format(eventDate, 'HH:mm')}</div>
                                <div className={`text-[10px] px-2 py-0.5 font-bold w-16 text-center ${
                                  isHigh ? 'bg-destructive text-destructive-foreground' : 
                                  isMed ? 'bg-amber-500 text-black' : 
                                  'bg-primary/20 text-primary'
                                }`}>
                                  {event.importance.toUpperCase()}
                                </div>
                                <div className="text-lg font-bold text-muted-foreground">{event.country}</div>
                              </div>
                              
                              <div className="flex-1">
                                <div className="text-base font-bold text-foreground">{event.name}</div>
                                {event.description && (
                                  <div className="text-xs text-muted-foreground mt-1 line-clamp-1">{event.description}</div>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-6 w-full md:w-auto shrink-0 font-mono text-sm">
                                <div className="w-20 text-right">
                                  <div className="text-[10px] text-muted-foreground mb-0.5">ACTUAL</div>
                                  <div className={`font-bold ${event.actual ? 'text-primary' : 'text-muted-foreground'}`}>
                                    {event.actual || '-'}
                                  </div>
                                </div>
                                <div className="w-20 text-right">
                                  <div className="text-[10px] text-muted-foreground mb-0.5">FORECAST</div>
                                  <div>{event.forecast || '-'}</div>
                                </div>
                                <div className="w-20 text-right">
                                  <div className="text-[10px] text-muted-foreground mb-0.5">PREVIOUS</div>
                                  <div className="text-muted-foreground">{event.previous || '-'}</div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  {sortedDates.length === 0 && (
                    <div className="py-12 text-center text-muted-foreground font-mono">
                      NO EVENTS SCHEDULED.
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
