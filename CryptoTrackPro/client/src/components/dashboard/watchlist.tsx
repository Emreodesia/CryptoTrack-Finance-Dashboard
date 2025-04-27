import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import apiService from "@/lib/api";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function Watchlist() {
  const { toast } = useToast();
  const [isAddCoinOpen, setIsAddCoinOpen] = useState(false);
  const [coinId, setCoinId] = useState("");
  
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
  
  // Format sparkline data for the chart
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

  const isLoading = isWatchlistLoading || isCoinsLoading;

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-800 flex justify-between items-center">
        <h3 className="font-medium text-white">Your Watchlist</h3>
        <button 
          className="text-sm text-primary-500 hover:text-primary-400"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/watchlist'] })}
        >
          Refresh
        </button>
      </div>
      
      <ul className="divide-y divide-gray-800">
        {isLoading ? (
          Array(3).fill(0).map((_, index) => (
            <li key={index} className="px-4 py-3">
              <Skeleton className="h-16 w-full" />
            </li>
          ))
        ) : !watchlistItems || watchlistItems.length === 0 ? (
          <li className="px-4 py-8 text-center text-gray-400">
            <i className="ri-star-line text-3xl mb-2"></i>
            <p>Your watchlist is empty</p>
          </li>
        ) : (
          watchlistItems.map(item => {
            const coin = item.details;
            return (
              <li key={item.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-800">
                <div className="flex items-center">
                  <img 
                    src={coin.image} 
                    alt={coin.name} 
                    className="w-8 h-8 mr-3"
                    onError={(e) => {
                      e.currentTarget.src = `https://via.placeholder.com/32x32.png?text=${coin.symbol}`;
                    }}
                  />
                  <div>
                    <h4 className="font-medium text-white">{coin.symbol.toUpperCase()}</h4>
                    <div className="flex items-center">
                      <p className="text-xs text-gray-400">Vol: ${(coin.total_volume / 1e9).toFixed(1)}B</p>
                      <p className={`text-xs ${coin.price_change_percentage_24h >= 0 ? 'text-green-500' : 'text-red-500'} ml-2 flex items-center`}>
                        <i className={coin.price_change_percentage_24h >= 0 ? 'ri-arrow-up-s-fill' : 'ri-arrow-down-s-fill'}></i>
                        {Math.abs(coin.price_change_percentage_24h).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono font-medium text-white">
                    ${coin.current_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
                  </p>
                  <div className="w-16 h-6">
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
                </div>
              </li>
            );
          })
        )}
      </ul>
      
      <div className="p-4">
        <button 
          className="w-full py-2 rounded-md border border-primary-600 text-primary-500 hover:bg-primary-600/10"
          onClick={() => setIsAddCoinOpen(true)}
        >
          <i className="ri-add-line mr-1"></i> Add to Watchlist
        </button>
      </div>
      
      <Dialog open={isAddCoinOpen} onOpenChange={setIsAddCoinOpen}>
        <DialogContent className="bg-gray-900 text-white">
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
    </div>
  );
}
