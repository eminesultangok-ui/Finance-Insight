import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import Dashboard from './pages/Dashboard';
import Market from './pages/Market';
import SymbolDetail from './pages/SymbolDetail';
import News from './pages/News';
import Calendar from './pages/Calendar';
import Admin from './pages/Admin';

const queryClient = new QueryClient();

function NotFound() {
  return (
    <div className="min-h-[100dvh] bg-[var(--bg-base)] text-[var(--text-primary)] flex items-center justify-center p-4 font-sans">
      <div className="border border-[var(--border)] bg-[var(--bg-surface)] p-8 max-w-md w-full rounded-[10px] text-center">
        <h1 className="text-[var(--text-primary)] font-semibold text-lg mb-2">
          Page Not Found
        </h1>
        <p className="text-[14px] text-[var(--text-secondary)] mb-6">
          The requested section could not be found or access is restricted.
        </p>
        <a href="/" className="inline-block text-[13px] font-medium bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-primary)] px-4 py-2 rounded-[8px] hover:bg-[var(--bg-elevated)] transition-colors">
          Return to Dashboard
        </a>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/market" component={Market} />
      <Route path="/market/:symbol" component={SymbolDetail} />
      <Route path="/news" component={News} />
      <Route path="/calendar" component={Calendar} />
      <Route path="/admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
