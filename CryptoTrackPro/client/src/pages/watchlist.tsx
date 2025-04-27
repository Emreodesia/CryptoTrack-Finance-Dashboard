import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import apiService from "@/lib/api";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function WatchlistPage() {
  const { toast } = useToast();
  const [isAddCoinOpen, setIsAddCoinOpen] = useState(false);
  const [coinId, setCoinId] = useState("");
  const [selectedCoin, setSelectedCoin] = useState<any>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<"1H" | "24H" | "7D" | "1M" | "1Y">("7D");
  
  // Fetch watchlist data
  const { data: watchlist, isLoading: isWatchlistLoading } = useQuery({
    queryKey: ['/api/watchlist'],
    queryFn: apiService.getWatchlist,
  });
  
  // Fetch coins data to display details for watchlist items
  const { data: coins, isLoading: isCoinsLoading } = useQuery({
    queryKey: ['/api/coins', 1, 100, 'usd'],
    queryFn: () => apiService.getCoins(1, 100, 'usd'),
    enabled: !!watchlist && watchlist.length > 0,
  });

  // Fetch chart data for selected coin
  const { data: chartData, isLoading: isChartLoading } = useQuery({
    queryKey: ['/api/coins', selectedCoin?.id, 'chart', selectedTimeframe],
    queryFn: () => selectedCoin ? apiService.getCoinChart(selectedCoin.id, getDaysFromTimeRange(selectedTimeframe)) : null,
    enabled: !!selectedCoin,
  });
  
  // Add coin to watchlist mutation
  const addToWatchlistMutation = useMutation({
    mutationFn: apiService.addToWatchlist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/watchlist'] });
      setIsAddCoinOpen(false);
      setCoinId("");
      toast({
        title: "Added to Watchlist",
        description: "Coin has been added to your watchlist",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add coin to watchlist",
        variant: "destructive",
      });
    }
  });
  
  // Remove coin from watchlist mutation
  const removeFromWatchlistMutation = useMutation({
    mutationFn: apiService.removeFromWatchlist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/watchlist'] });
      toast({
        title: "Removed from Watchlist",
        description: "Coin has been removed from your watchlist",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove coin from watchlist",
        variant: "destructive",
      });
    }
  });

  // Convert time range to days for API
  const getDaysFromTimeRange = (range: string): string => {
    switch (range) {
      case "1H": return "0.04"; // ~1 hour (1/24 of a day)
      case "24H": return "1";
      case "7D": return "7";
      case "1M": return "30";
      case "1Y": return "365";
      default: return "7";
    }
  };
  
  // Format chart data
  const formatChartData = (data: any) => {
    if (!data || !data.prices) return [];
    
    return data.prices.map((point: [number, number]) => {
      const [timestamp, price] = point;
      return {
        timestamp,
        date: new Date(timestamp),
        price,
      };
    });
  };
  
  const formattedChartData = chartData ? formatChartData(chartData) : [];
  
  // Prepare watchlist items with coin details
  const watchlistItems = watchlist && coins
    ? watchlist.map(item => {
        const coinDetails = coins.find(coin => coin.id === item.coinId);
        return { 
          id: item.id,
          coinId: item.coinId,
          details: coinDetails
        };
      }).filter(item => item.details)
    : [];
  
  // Format sparkline data for the small charts
  const formatSparklineData = (sparkline: number[]) => {
    if (!sparkline) return [];
    
    return sparkline.map((price, index) => ({
      timestamp: index,
      price,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!coinId) {
      toast({
        title: "Validation Error",
        description: "Please enter a coin ID",
        variant: "destructive",
      });
      return;
    }
    
    addToWatchlistMutation.mutate(coinId);
  };

  const handleViewCoin = (coin: any) => {
    setSelectedCoin(coin);
  };

  const handleRemoveFromWatchlist = (id: number) => {
    if (window.confirm("Are you sure you want to remove this coin from your watchlist?")) {
      removeFromWatchlistMutation.mutate(id);
      
      // If the removed coin is the selected one, clear selection
      if (selectedCoin && selectedCoin.id === id) {
        setSelectedCoin(null);
      }
    }
  };

  const isLoading = isWatchlistLoading || isCoinsLoading;

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
                <h1 className="text-2xl font-semibold text-white">Watchlist</h1>
                <p className="mt-1 text-sm text-gray-400">Track your favorite cryptocurrencies</p>
              </div>
              <div className="mt-4 md:mt-0 flex space-x-3">
                <Button
                  variant="outline"
                  className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/watchlist'] })}
                >
                  <i className="ri-refresh-line mr-2"></i> Refresh
                </Button>
                <Button
                  className="bg-primary-600 hover:bg-primary-700"
                  onClick={() => setIsAddCoinOpen(true)}
                >
                  <i className="ri-add-line mr-2"></i> Add Coin
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Watchlist Table */}
            <div className="lg:col-span-5">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Your Watchlist</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-4">
                      {Array(5).fill(0).map((_, index) => (
                        <Skeleton key={index} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : !watchlistItems || watchlistItems.length === 0 ? (
                    <div className="py-10 text-center text-gray-400">
                      <i className="ri-star-line text-5xl mb-3"></i>
                      <p className="mb-4">Your watchlist is empty</p>
                      <Button
                        className="bg-primary-600 hover:bg-primary-700"
                        onClick={() => setIsAddCoinOpen(true)}
                      >
                        Add Your First Coin
                      </Button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto -mx-4">
                      <Table>
                        <TableHeader className="bg-gray-800">
                          <TableRow>
                            <TableHead>Coin</TableHead>
                            <TableHead className="text-right">Price</TableHead>
                            <TableHead className="text-right">24h %</TableHead>
                            <TableHead className="text-right">7d %</TableHead>
                            <TableHead className="text-right">Chart</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {watchlistItems.map(item => {
                            const coin = item.details;
                            return (
                              <TableRow 
                                key={item.id} 
                                className={`hover:bg-gray-800 cursor-pointer ${selectedCoin?.id === item.id ? 'bg-gray-800' : ''}`}
                                onClick={() => handleViewCoin(coin)}
                              >
                                <TableCell className="font-medium">
                                  <div className="flex items-center">
                                    <img 
                                      src={coin.image} 
                                      alt={coin.name} 
                                      className="w-8 h-8 mr-3"
                                      onError={(e) => {
                                        e.currentTarget.src = `https://via.placeholder.com/32x32.png?text=${coin.symbol.substring(0, 2).toUpperCase()}`;
                                      }}
                                    />
                                    <div>
                                      <div className="text-white">{coin.name}</div>
                                      <div className="text-xs text-gray-400">{coin.symbol.toUpperCase()}</div>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right font-mono text-white">
                                  ${coin.current_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
                                </TableCell>
                                <TableCell className={`text-right ${coin.price_change_percentage_24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                  {coin.price_change_percentage_24h >= 0 ? '+' : ''}
                                  {coin.price_change_percentage_24h.toFixed(2)}%
                                </TableCell>
                                <TableCell className={`text-right ${coin.price_change_percentage_7d_in_currency >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                  {coin.price_change_percentage_7d_in_currency >= 0 ? '+' : ''}
                                  {coin.price_change_percentage_7d_in_currency.toFixed(2)}%
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="w-16 h-6 inline-block">
                                    <ResponsiveContainer width="100%" height="100%">
                                      <LineChart data={formatSparklineData(coin.sparkline_in_7d?.price)}>
                                        <Line 
                                          type="monotone" 
                                          dataKey="price" 
                                          stroke={coin.price_change_percentage_7d_in_currency >= 0 ? "#10B981" : "#EF4444"} 
                                          strokeWidth={1.5} 
                                          dot={false}
                                        />
                                      </LineChart>
                                    </ResponsiveContainer>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex justify-end">
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      className="h-8 px-2 text-red-500 border-gray-700 hover:text-white hover:bg-red-600"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveFromWatchlist(item.id);
                                      }}
                                    >
                                      <i className="ri-delete-bin-line text-base"></i>
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Coin Detail View */}
            <div className="lg:col-span-7">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">
                    {selectedCoin ? (
                      <div className="flex items-center">
                        <img 
                          src={selectedCoin.image} 
                          alt={selectedCoin.name} 
                          className="w-8 h-8 mr-3"
                          onError={(e) => {
                            e.currentTarget.src = `https://via.placeholder.com/32x32.png?text=${selectedCoin.symbol.substring(0, 2).toUpperCase()}`;
                          }}
                        />
                        <span>{selectedCoin.name} ({selectedCoin.symbol.toUpperCase()}) Detail</span>
                      </div>
                    ) : (
                      "Coin Detail"
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!selectedCoin ? (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                      <i className="ri-line-chart-line text-5xl mb-3"></i>
                      <p>Select a coin from your watchlist to view details</p>
                    </div>
                  ) : (
                    <div>
                      {/* Coin Header Info */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
                        <div className="mb-4 sm:mb-0">
                          <div className="flex items-center">
                            <span className="text-2xl font-mono font-bold text-white mr-2">
                              ${selectedCoin.current_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
                            </span>
                            <span className={`flex items-center text-sm font-medium ${selectedCoin.price_change_percentage_24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              <i className={selectedCoin.price_change_percentage_24h >= 0 ? 'ri-arrow-up-s-fill mr-1' : 'ri-arrow-down-s-fill mr-1'}></i>
                              {Math.abs(selectedCoin.price_change_percentage_24h).toFixed(2)}%
                            </span>
                          </div>
                          <div className="text-sm text-gray-400 mt-1">
                            Market Cap: ${(selectedCoin.market_cap / 1e9).toFixed(2)}B • 
                            Vol 24h: ${(selectedCoin.total_volume / 1e9).toFixed(2)}B
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          {(["1H", "24H", "7D", "1M", "1Y"] as const).map((range) => (
                            <button
                              key={range}
                              className={`px-3 py-1 text-xs font-medium rounded ${
                                selectedTimeframe === range 
                                  ? 'bg-primary-600 text-white' 
                                  : 'bg-gray-800 text-gray-400 hover:text-white'
                              }`}
                              onClick={() => setSelectedTimeframe(range)}
                            >
                              {range}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Chart */}
                      <div className="h-64 mb-6">
                        {isChartLoading ? (
                          <div className="h-full flex items-center justify-center">
                            <div className="animate-spin w-10 h-10 border-t-2 border-b-2 border-primary-600 rounded-full"></div>
                          </div>
                        ) : !formattedChartData || formattedChartData.length === 0 ? (
                          <div className="h-full flex items-center justify-center text-gray-400">
                            No chart data available
                          </div>
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={formattedChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                              <defs>
                                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                  <stop 
                                    offset="5%" 
                                    stopColor={selectedCoin.price_change_percentage_24h >= 0 ? "#10B981" : "#EF4444"} 
                                    stopOpacity={0.8}
                                  />
                                  <stop 
                                    offset="95%" 
                                    stopColor={selectedCoin.price_change_percentage_24h >= 0 ? "#10B981" : "#EF4444"} 
                                    stopOpacity={0}
                                  />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                              <XAxis 
                                dataKey="timestamp" 
                                tickFormatter={(timestamp) => {
                                  const date = new Date(timestamp);
                                  if (selectedTimeframe === "1H" || selectedTimeframe === "24H") {
                                    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                  } else if (selectedTimeframe === "7D") {
                                    return date.toLocaleDateString([], { weekday: 'short' });
                                  } else if (selectedTimeframe === "1M") {
                                    return date.toLocaleDateString([], { day: 'numeric', month: 'short' });
                                  } else {
                                    return date.toLocaleDateString([], { month: 'short' });
                                  }
                                }}
                                tick={{ fill: '#9CA3AF' }}
                                axisLine={{ stroke: '#444' }}
                              />
                              <YAxis 
                                domain={['auto', 'auto']}
                                tickFormatter={(value) => `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
                                tick={{ fill: '#9CA3AF' }}
                                axisLine={{ stroke: '#444' }}
                              />
                              <Tooltip 
                                formatter={(value: number) => [`$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}`, 'Price']}
                                labelFormatter={(timestamp) => new Date(timestamp).toLocaleString()}
                                contentStyle={{ backgroundColor: '#1E1E1E', borderColor: '#4F46E5' }}
                              />
                              <Area 
                                type="monotone" 
                                dataKey="price" 
                                stroke={selectedCoin.price_change_percentage_24h >= 0 ? "#10B981" : "#EF4444"} 
                                fillOpacity={1}
                                fill="url(#colorPrice)" 
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        )}
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-gray-800 p-3 rounded-lg">
                          <div className="text-xs text-gray-400 mb-1">Market Cap Rank</div>
                          <div className="text-lg font-semibold">#{selectedCoin.market_cap_rank}</div>
                        </div>
                        <div className="bg-gray-800 p-3 rounded-lg">
                          <div className="text-xs text-gray-400 mb-1">Circulating Supply</div>
                          <div className="text-lg font-semibold">
                            {selectedCoin.circulating_supply ? selectedCoin.circulating_supply.toLocaleString(undefined, { maximumFractionDigits: 0 }) : 'N/A'}
                          </div>
                        </div>
                        <div className="bg-gray-800 p-3 rounded-lg">
                          <div className="text-xs text-gray-400 mb-1">24h High</div>
                          <div className="text-lg font-semibold">
                            ${selectedCoin.high_24h?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 }) || 'N/A'}
                          </div>
                        </div>
                        <div className="bg-gray-800 p-3 rounded-lg">
                          <div className="text-xs text-gray-400 mb-1">24h Low</div>
                          <div className="text-lg font-semibold">
                            ${selectedCoin.low_24h?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 }) || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Add Coin Dialog */}
          <Dialog open={isAddCoinOpen} onOpenChange={setIsAddCoinOpen}>
            <DialogContent className="bg-gray-900 text-white border-gray-800">
              <DialogHeader>
                <DialogTitle>Add to Watchlist</DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                <div className="grid gap-2">
                  <Label htmlFor="coinId">Coin ID</Label>
                  <Input 
                    id="coinId" 
                    placeholder="e.g., bitcoin" 
                    value={coinId}
                    onChange={(e) => setCoinId(e.target.value)}
                    className="bg-gray-800 border-gray-700"
                  />
                  <p className="text-xs text-gray-400">
                    Enter the CoinGecko ID of the cryptocurrency (e.g., bitcoin, ethereum, solana)
                  </p>
                </div>
                
                <DialogFooter className="mt-6">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsAddCoinOpen(false)}
                    className="border-gray-700 text-white hover:bg-gray-800"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={addToWatchlistMutation.isPending}
                    className="bg-primary-600 hover:bg-primary-700"
                  >
                    {addToWatchlistMutation.isPending ? "Adding..." : "Add Coin"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
