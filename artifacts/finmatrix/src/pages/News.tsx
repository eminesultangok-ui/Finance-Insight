import { useState } from "react";
import { useGetNews, NewsArticleCategory } from "@workspace/api-client-react";
import { Layout } from "@/components/Layout";
import { Panel, LoadingPanel, ErrorPanel } from "@/components/Panel";
import { format } from "date-fns";

const CATEGORIES = [
  { id: "all", label: "All News" },
  { id: "stock_market", label: "Stock Market" },
  { id: "central_banks", label: "Central Banks" },
  { id: "inflation", label: "Inflation" },
  { id: "interest_rates", label: "Interest Rates" },
  { id: "commodities", label: "Commodities" },
  { id: "crypto", label: "Crypto" },
  { id: "global_markets", label: "Global Markets" },
  { id: "company_news", label: "Company News" },
];

export default function News() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  
  const categoryParam = activeCategory === "all" ? undefined : (activeCategory as NewsArticleCategory);
  
  const { data: news, isLoading, error } = useGetNews({ 
    category: categoryParam,
    limit: 50 
  });

  return (
    <Layout>
      <div className="h-full flex flex-col gap-5 max-w-[1200px] mx-auto">
        <Panel className="shrink-0 p-0 overflow-visible bg-transparent border-none">
          <div className="flex items-center pb-2 overflow-x-auto custom-scrollbar">
            <div className="flex gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-4 py-1.5 text-[13px] font-medium rounded-[100px] whitespace-nowrap transition-colors border ${
                    activeCategory === cat.id 
                      ? 'bg-[var(--accent)] text-white border-[var(--accent)]' 
                      : 'bg-[var(--bg-input)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] border-[var(--border)]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </Panel>

        <div className="flex-1 min-h-0">
          {isLoading ? (
            <LoadingPanel title="News Feed" />
          ) : error ? (
            <ErrorPanel title="News Error" error={error} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 h-full overflow-auto pb-8 custom-scrollbar pr-2">
              {news?.articles.map((article) => (
                <a 
                  key={article.id} 
                  href={article.url} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="flex flex-col border border-[var(--border)] bg-[var(--bg-surface)] rounded-[10px] hover:bg-[var(--bg-elevated)] hover:border-[var(--text-muted)] transition-all p-5 group"
                >
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <span className="text-[11px] font-medium tracking-[0.04em] text-[var(--text-secondary)] uppercase">{article.source}</span>
                    <span className="text-[11px] text-[var(--text-muted)] tabular-nums">{format(new Date(article.publishedAt), 'MMM dd, HH:mm')}</span>
                  </div>
                  
                  <h3 className="text-[16px] font-semibold leading-[1.4] mb-3 group-hover:text-[var(--accent)] transition-colors text-[var(--text-primary)]">
                    {article.title}
                  </h3>
                  
                  {article.summary && (
                    <p className="text-[14px] text-[var(--text-secondary)] leading-[1.6] line-clamp-3 mb-5 flex-1">
                      {article.summary}
                    </p>
                  )}
                  
                  <div className="mt-auto pt-4 border-t border-[var(--border-subtle)] flex justify-between items-center text-[12px] font-medium">
                    <span className="text-[var(--text-muted)] capitalize">{article.category.replace('_', ' ')}</span>
                    <span className="text-[var(--accent)]">Read article →</span>
                  </div>
                </a>
              ))}
              {news?.articles.length === 0 && (
                <div className="col-span-full py-16 text-center text-[var(--text-muted)] bg-[var(--bg-surface)] border border-[var(--border)] rounded-[10px]">
                  No news articles found in this category.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
