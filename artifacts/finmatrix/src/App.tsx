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
    <div className="min-h-screen bg-black text-primary font-mono flex items-center justify-center p-4">
      <div className="border border-destructive/50 bg-destructive/10 p-8 max-w-md w-full relative">
        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-destructive"></div>
        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-destructive"></div>
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-destructive"></div>
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-destructive"></div>
        
        <h1 className="text-destructive font-bold text-2xl mb-4 flex items-center gap-3">
          <span className="animate-pulse">⚠</span> ERROR 404
        </h1>
        <p className="text-sm text-destructive/80 mb-6 uppercase">
          Sector sector not found. The requested terminal pathway does not exist or access is restricted.
        </p>
        <a href="/" className="inline-block text-xs border border-destructive/50 text-destructive px-4 py-2 hover:bg-destructive hover:text-black transition-colors">
          RETURN TO COMMAND CENTER
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
