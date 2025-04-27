import { useQuery } from "@tanstack/react-query";
import apiService from "@/lib/api";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import MarketSummaryCard from "@/components/dashboard/market-summary-card";
import CryptoChart from "@/components/dashboard/crypto-chart";
import PortfolioSummary from "@/components/dashboard/portfolio-summary";
import CryptoTable from "@/components/dashboard/crypto-table";
import { TopGainers, TopLosers } from "@/components/dashboard/top-movers";
import Watchlist from "@/components/dashboard/watchlist";
import MarketNews from "@/components/dashboard/market-news";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  // Fetch market data
  const { data: marketData, isLoading: isMarketDataLoading } = useQuery({
    queryKey: ['/api/market-data'],
    queryFn: apiService.getMarketData,
  });
  
  // Fetch top coins for main chart
  const { data: topCoins, isLoading: isTopCoinsLoading } = useQuery({
    queryKey: ['/api/coins', 1, 5, 'usd'],
    queryFn: () => apiService.getCoins(1, 5, 'usd'),
  });
  
  // Process market data
  const marketStats = marketData?.data ? {
    marketCap: {
      value: `$${(marketData.data.total_market_cap.usd / 1e12).toFixed(2)}T`,
      change: marketData.data.market_cap_change_percentage_24h_usd,
    },
    volume: {
      value: `$${(marketData.data.total_volume.usd / 1e9).toFixed(1)}B`,
      change: 3.8, // Example since API doesn't provide this directly
    },
    btcDominance: {
      value: `${marketData.data.market_cap_percentage.btc.toFixed(1)}%`,
      change: -0.7, // Example change
    },
    activeCryptos: {
      value: `${marketData.data.active_cryptocurrencies.toLocaleString()}`,
    },
  } : null;

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
                <h1 className="text-2xl font-semibold text-white">Dashboard Overview</h1>
                <p className="mt-1 text-sm text-gray-400">Real-time cryptocurrency market data and analytics</p>
              </div>
              <div className="mt-4 md:mt-0 flex space-x-3">
                <button className="inline-flex items-center px-4 py-2 border border-gray-800 rounded-md bg-gray-800 text-sm font-medium text-white hover:bg-gray-700">
                  <i className="ri-refresh-line mr-2"></i> Refresh
                </button>
                <div className="relative inline-block text-left">
                  <button className="inline-flex items-center px-4 py-2 border border-gray-800 rounded-md bg-gray-800 text-sm font-medium text-white hover:bg-gray-700">
                    <span>Last 24 hours</span>
                    <i className="ri-arrow-down-s-line ml-2"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Market Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {isMarketDataLoading ? (
              Array(4).fill(0).map((_, index) => (
                <Skeleton key={index} className="h-24 w-full" />
              ))
            ) : marketStats ? (
              <>
                <MarketSummaryCard 
                  title="Market Cap" 
                  value={marketStats.marketCap.value} 
                  subValue="USD" 
                  change={marketStats.marketCap.change} 
                />
                <MarketSummaryCard 
                  title="24h Volume" 
                  value={marketStats.volume.value} 
                  subValue="USD" 
                  change={marketStats.volume.change} 
                />
                <MarketSummaryCard 
                  title="BTC Dominance" 
                  value={marketStats.btcDominance.value} 
                  change={marketStats.btcDominance.change} 
                />
                <MarketSummaryCard 
                  title="Active Cryptocurrencies" 
                  value={marketStats.activeCryptos.value} 
                />
              </>
            ) : (
              Array(4).fill(0).map((_, index) => (
                <MarketSummaryCard 
                  key={index}
                  title="Loading..." 
                  value="--" 
                />
              ))
            )}
          </div>

          {/* 2-Column Layout for Charts and Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* First Column: Main Chart + Top Movers */}
            <div className="lg:col-span-8 space-y-6">
              {/* Main Chart */}
              {isTopCoinsLoading ? (
                <Skeleton className="h-80 w-full" />
              ) : topCoins && topCoins.length > 0 ? (
                <CryptoChart 
                  coinId={topCoins[0].id}
                  symbol={topCoins[0].symbol}
                  name={topCoins[0].name}
                  currentPrice={topCoins[0].current_price}
                  priceChange24h={topCoins[0].price_change_percentage_24h}
                />
              ) : (
                <div className="bg-gray-900 rounded-lg border border-gray-800 p-8 text-center text-gray-400">
                  Failed to load chart data
                </div>
              )}
              
              {/* Top Gainers & Losers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <TopGainers />
                <TopLosers />
              </div>
            </div>
            
            {/* Second Column: Portfolio + Watchlist */}
            <div className="lg:col-span-4 space-y-6">
              <PortfolioSummary />
              <Watchlist />
              <MarketNews />
            </div>
          </div>
          
          {/* Cryptocurrency Table */}
          <div className="mt-6">
            <CryptoTable limit={5} />
          </div>
        </main>
      </div>
    </div>
  );
}
