import { useQuery } from "@tanstack/react-query";
import apiService from "@/lib/api";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

export default function NewsPage() {
  const [activeCategory, setActiveCategory] = useState("all");

  // Fetch news data
  const { data: news, isLoading, error } = useQuery({
    queryKey: ['/api/news'],
    queryFn: apiService.getNews,
  });

  // Fetch top coins for news filtering
  const { data: topCoins } = useQuery({
    queryKey: ['/api/coins', 1, 5, 'usd'],
    queryFn: () => apiService.getCoins(1, 5, 'usd'),
  });

  // Calculate time ago
  const timeAgo = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const diff = now.getTime() - past.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    }
  };

  // Generate more mock news for demo
  const generateMoreNews = () => {
    if (!news || news.length === 0 || !topCoins) return [];
    
    const baseNews = Array.isArray(news) ? [...news] : [];
    
    // Add some coin-specific news based on top coins
    const coinNews = topCoins.slice(0, 5).map((coin: any, index: number) => ({
      id: baseNews.length + index + 1,
      title: `${coin.name} Price ${coin.price_change_percentage_24h >= 0 ? 'Surges' : 'Drops'} as ${coin.price_change_percentage_24h >= 0 ? 'Bulls Take Control' : 'Bears Dominate Market'}`,
      summary: `${coin.name} (${coin.symbol.toUpperCase()}) has ${coin.price_change_percentage_24h >= 0 ? 'surged' : 'plummeted'} by ${Math.abs(coin.price_change_percentage_24h).toFixed(2)}% in the last 24 hours as ${coin.price_change_percentage_24h >= 0 ? 'bullish momentum builds' : 'selling pressure mounts'}. Analysts point to ${coin.price_change_percentage_24h >= 0 ? 'growing institutional interest' : 'market uncertainty'} as a key factor.`,
      source: index % 2 === 0 ? "CryptoNews" : "BlockchainTimes",
      publishedAt: new Date(Date.now() - (index * 3600000 + 1800000)).toISOString(), // Staggered times
      imageUrl: coin.image,
      url: "#",
      category: coin.id
    }));
    
    // Add market news
    const marketNews = [
      {
        id: baseNews.length + coinNews.length + 1,
        title: "Crypto Market Analysis: Key Trends for Q3 2023",
        summary: "As we move into the third quarter of 2023, several key trends are emerging in the cryptocurrency market. DeFi protocols continue to gain traction, while regulatory clarity improves across major jurisdictions.",
        source: "CryptoAnalytics",
        publishedAt: new Date(Date.now() - 4500000).toISOString(),
        imageUrl: "https://images.unsplash.com/photo-1605792657660-596af9009e82?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80",
        url: "#",
        category: "market"
      },
      {
        id: baseNews.length + coinNews.length + 2,
        title: "Institutional Investors Allocate Record Amount to Crypto Assets",
        summary: "New data shows that institutional investment in cryptocurrency has reached all-time highs in 2023, with asset managers, hedge funds, and even pension funds allocating capital to digital assets.",
        source: "FinanceInsider",
        publishedAt: new Date(Date.now() - 5400000).toISOString(),
        imageUrl: "https://images.unsplash.com/photo-1551135049-8a33b5883817?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80",
        url: "#",
        category: "market"
      }
    ];
    
    // Add regulation news
    const regulationNews = [
      {
        id: baseNews.length + coinNews.length + 3,
        title: "SEC Chairman Discusses Future of Crypto Regulation in Senate Hearing",
        summary: "In a recent Senate Banking Committee hearing, the SEC Chairman outlined the agency's approach to cryptocurrency regulation, emphasizing investor protection while acknowledging the need for innovation.",
        source: "RegulatoryWatch",
        publishedAt: new Date(Date.now() - 9000000).toISOString(),
        imageUrl: "https://images.unsplash.com/photo-1589578228447-e1a4e481c6c8?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80",
        url: "#",
        category: "regulation"
      },
      {
        id: baseNews.length + coinNews.length + 4,
        title: "New Crypto Tax Reporting Requirements to Take Effect Next Year",
        summary: "Tax authorities have announced new reporting requirements for cryptocurrency transactions, which will come into effect in the next fiscal year. Exchanges and individuals will need to comply with stricter documentation standards.",
        source: "TaxReporter",
        publishedAt: new Date(Date.now() - 12600000).toISOString(),
        imageUrl: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80",
        url: "#",
        category: "regulation"
      }
    ];
    
    return [...baseNews, ...coinNews, ...marketNews, ...regulationNews];
  };

  const extendedNews = generateMoreNews();
  
  // Filter news by category
  const filteredNews = extendedNews.filter(item => {
    if (activeCategory === "all") return true;
    
    if (activeCategory === "bitcoin" || activeCategory === "ethereum") {
      return item.category === activeCategory || 
             item.title.toLowerCase().includes(activeCategory) || 
             item.summary.toLowerCase().includes(activeCategory);
    }
    
    return item.category === activeCategory;
  });

  const newsCategories = [
    { id: "all", label: "All News" },
    { id: "bitcoin", label: "Bitcoin" },
    { id: "ethereum", label: "Ethereum" },
    { id: "market", label: "Market" },
    { id: "regulation", label: "Regulation" }
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-gray-950 text-gray-100">
      <Sidebar />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto bg-gray-950 p-4 md:p-6">
          {/* Page Header */}
          <div className="mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-white">Crypto News</h1>
                <p className="mt-1 text-sm text-gray-400">Latest updates from the cryptocurrency world</p>
              </div>
            </div>
          </div>

          {/* News Category Tabs */}
          <Tabs defaultValue="all" value={activeCategory} onValueChange={setActiveCategory} className="mb-6">
            <TabsList className="bg-gray-900 border border-gray-800">
              {newsCategories.map(category => (
                <TabsTrigger 
                  key={category.id} 
                  value={category.id}
                  className="data-[state=active]:bg-primary-600 data-[state=active]:text-white"
                >
                  {category.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* News Content */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array(6).fill(0).map((_, index) => (
                <Card key={index} className="bg-gray-900 border-gray-800">
                  <CardContent className="p-0">
                    <Skeleton className="h-48 w-full rounded-t-lg" />
                    <div className="p-4">
                      <Skeleton className="h-6 w-full mb-2" />
                      <Skeleton className="h-4 w-full mb-1" />
                      <Skeleton className="h-4 w-3/4 mb-3" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : error ? (
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-6 text-center text-red-500">
                <i className="ri-error-warning-line text-5xl mb-3"></i>
                <p>Failed to load news. Please try again later.</p>
              </CardContent>
            </Card>
          ) : filteredNews.length === 0 ? (
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-6 text-center text-gray-400">
                <i className="ri-newspaper-line text-5xl mb-3"></i>
                <p>No news available for this category.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredNews.map((item: any) => (
                <Card key={item.id} className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors cursor-pointer overflow-hidden">
                  <CardContent className="p-0">
                    <div className="h-48 overflow-hidden">
                      <img 
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform"
                        onError={(e) => {
                          e.currentTarget.src = "https://via.placeholder.com/400x200?text=Crypto+News";
                        }}
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium text-white text-lg mb-2 line-clamp-2">{item.title}</h3>
                      <p className="text-sm text-gray-400 mb-3 line-clamp-3">{item.summary}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{item.source}</span>
                        <span>{timeAgo(item.publishedAt)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Featured News (for bigger screens) */}
          {!isLoading && !error && filteredNews.length > 0 && (
            <div className="mt-8 hidden xl:block">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Featured News</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Featured news item */}
                    <div className="flex flex-col">
                      <img 
                        src={filteredNews[0]?.imageUrl}
                        alt={filteredNews[0]?.title}
                        className="w-full h-64 object-cover rounded-lg mb-4"
                        onError={(e) => {
                          e.currentTarget.src = "https://via.placeholder.com/800x400?text=Featured+Crypto+News";
                        }}
                      />
                      <h2 className="text-xl font-semibold text-white mb-2">{filteredNews[0]?.title}</h2>
                      <p className="text-gray-400 mb-3">{filteredNews[0]?.summary}</p>
                      <div className="flex items-center justify-between text-sm text-gray-500 mt-auto">
                        <span>{filteredNews[0]?.source}</span>
                        <span>{timeAgo(filteredNews[0]?.publishedAt)}</span>
                      </div>
                    </div>
                    
                    {/* Recent news list */}
                    <div>
                      <h3 className="text-lg font-medium text-white mb-4">Recent News</h3>
                      <div className="space-y-4">
                        {filteredNews.slice(1, 5).map((item: any) => (
                          <div key={item.id} className="flex hover:bg-gray-800 p-2 rounded-lg cursor-pointer">
                            <img 
                              src={item.imageUrl} 
                              alt={item.title}
                              className="w-16 h-16 rounded object-cover mr-3"
                              onError={(e) => {
                                e.currentTarget.src = "https://via.placeholder.com/64x64?text=News";
                              }}
                            />
                            <div>
                              <h4 className="font-medium text-white text-sm mb-1 line-clamp-2">{item.title}</h4>
                              <div className="flex items-center text-xs text-gray-500">
                                <span>{item.source}</span>
                                <span className="mx-1">•</span>
                                <span>{timeAgo(item.publishedAt)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
