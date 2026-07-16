import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Activity, BarChart2, Globe, LayoutDashboard, Settings } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "COMMAND CENTER", icon: LayoutDashboard },
    { href: "/market", label: "MARKET TERMINAL", icon: BarChart2 },
    { href: "/news", label: "NEWS HUB", icon: Globe },
    { href: "/calendar", label: "ECONOMIC CAL", icon: Activity },
    { href: "/admin", label: "ADMIN", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-black text-foreground font-mono flex flex-col dark overflow-hidden relative">
      <div className="crt-overlay"></div>
      <div className="scanline"></div>
      
      {/* Header/Nav */}
      <header className="border-b border-primary/50 bg-black/80 backdrop-blur z-40 relative px-4 h-14 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-6">
          <div className="text-primary font-bold text-xl tracking-tighter flex items-center gap-2">
            <span className="text-2xl animate-pulse">■</span> FINMATRIX
          </div>
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href || (location.startsWith(item.href) && item.href !== "/");
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors border ${
                    isActive 
                      ? "bg-primary/10 text-primary border-primary shadow-[0_0_10px_rgba(0,180,255,0.3)]" 
                      : "text-muted-foreground border-transparent hover:text-primary hover:border-primary/30"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">STATUS:</span>
            <span className="text-positive flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-positive animate-pulse-fast inline-block"></span>
              ONLINE
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">TIME:</span>
            <span className="text-primary">{new Date().toISOString().substring(11, 19)} UTC</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative z-30 p-4">
        {children}
      </main>
    </div>
  );
}
