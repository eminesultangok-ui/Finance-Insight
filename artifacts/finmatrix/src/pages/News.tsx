import { useState } from "react";
import { useGetNews, NewsArticleCategory } from "@workspace/api-client-react";
import { Layout } from "@/components/Layout";
import { Panel, LoadingPanel, ErrorPanel } from "@/components/Panel";
import { format } from "date-fns";

const CATEGORIES = [
  { id: "all", label: "ALL NEWS" },
  { id: "stock_market", label: "STOCK MARKET" },
  { id: "central_banks", label: "CENTRAL BANKS" },
  { id: "inflation", label: "INFLATION" },
  { id: "interest_rates", label: "INTEREST RATES" },
  { id: "commodities", label: "COMMODITIES" },
  { id: "crypto", label: "CRYPTO" },
  { id: "global_markets", label: "GLOBAL MARKETS" },
  { id: "company_news", label: "COMPANY NEWS" },
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
      <div className="h-full flex flex-col gap-4 max-w-[1200px] mx-auto">
        <Panel className="shrink-0 p-0 overflow-visible">
          <div className="flex items-center p-2 border-b border-primary/30 overflow-x-auto custom-scrollbar">
            <div className="flex gap-1">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-colors border ${
                    activeCategory === cat.id 
                      ? 'bg-primary/20 text-primary border-primary' 
                      : 'border-transparent text-muted-foreground hover:text-primary hover:bg-primary/5'
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
            <LoadingPanel title="NEWS FEED" />
          ) : error ? (
            <ErrorPanel title="NEWS ERROR" error={error} />
          ) : (
            <Panel title={`${activeCategory.replace('_', ' ').toUpperCase()} FEED`} className="h-full bg-black/50">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 h-full overflow-auto pr-2 pb-8">
                {news?.articles.map((article) => (
                  <a 
                    key={article.id} 
                    href={article.url} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="flex flex-col border border-primary/30 bg-card hover:bg-primary/5 hover:border-primary/60 transition-colors p-4 group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-16 h-16 bg-primary/10 rounded-bl-full -z-10 group-hover:bg-primary/20 transition-colors"></div>
                    
                    <div className="flex justify-between items-start gap-2 mb-3">
                      <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 font-bold uppercase tracking-wider border border-primary/20">{article.source}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">{format(new Date(article.publishedAt), 'MMM dd, HH:mm')}</span>
                    </div>
                    
                    <h3 className="text-lg font-bold leading-tight mb-2 group-hover:text-primary transition-colors line-clamp-3">
                      {article.title}
                    </h3>
                    
                    {article.summary && (
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1 font-sans">
                        {article.summary}
                      </p>
                    )}
                    
                    <div className="mt-auto pt-3 border-t border-primary/10 flex justify-between items-center text-xs font-bold">
                      <span className="text-muted-foreground uppercase">{article.category.replace('_', ' ')}</span>
                      <span className="text-primary group-hover:translate-x-1 transition-transform">READ →</span>
                    </div>
                  </a>
                ))}
                {news?.articles.length === 0 && (
                  <div className="col-span-full py-12 text-center text-muted-foreground font-mono">
                    NO NEWS ARTICLES FOUND IN THIS CATEGORY.
                  </div>
                )}
              </div>
            </Panel>
          )}
        </div>
      </div>
    </Layout>
  );
}
