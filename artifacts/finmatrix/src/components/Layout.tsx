import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Activity, BarChart2, Globe, LayoutDashboard, Settings } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/market", label: "Markets", icon: BarChart2 },
    { href: "/news", label: "News", icon: Globe },
    { href: "/calendar", label: "Calendar", icon: Activity },
    { href: "/admin", label: "Admin", icon: Settings },
  ];

  return (
    <div className="min-h-[100dvh] bg-[var(--bg-base)] text-[var(--text-primary)] font-sans flex flex-col dark overflow-hidden relative">
      {/* Header/Nav */}
      <header className="border-b border-[var(--border)] bg-[var(--bg-surface)] z-40 relative px-6 h-[52px] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-8 h-full">
          <div className="text-[var(--text-primary)] text-[14px] font-bold tracking-[0.08em] flex items-center gap-2 uppercase">
            FINMATRIX
          </div>
          <nav className="flex items-center h-full gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href || (location.startsWith(item.href) && item.href !== "/");
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-1.5 text-[13px] font-medium rounded-[6px] transition-colors ${
                    isActive 
                      ? "bg-[var(--accent-muted)] text-[var(--accent)]" 
                      : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        
        <div className="flex items-center gap-6 text-[12px]">
          <div className="flex items-center gap-2">
            <span className="text-[var(--text-secondary)] font-medium tracking-[0.04em] uppercase">Status</span>
            <span className="text-[var(--positive)] flex items-center gap-1.5 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--positive)] inline-block"></span>
              LIVE
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[var(--text-secondary)] font-medium tracking-[0.04em] uppercase">Time</span>
            <span className="text-[var(--text-muted)] tabular-nums">{new Date().toISOString().substring(11, 19)} UTC</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative z-30 p-5 max-w-full">
        {children}
      </main>
    </div>
  );
}
