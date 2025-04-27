import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import apiService from "@/lib/api";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

// Colors for the pie chart
const COLORS = ["#4F46E5", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

export default function PortfolioSummary() {
  const { toast } = useToast();
  const [isAddAssetOpen, setIsAddAssetOpen] = useState(false);
  const [newAsset, setNewAsset] = useState({
    coinId: "",
    symbol: "",
    name: "",
    amount: "",
    purchasePrice: ""
  });

  // Fetch portfolio data
  const { data: portfolio, isLoading } = useQuery({
    queryKey: ['/api/portfolio'],
    queryFn: apiService.getPortfolio,
  });

  // Mutation for adding a new asset
  const addAssetMutation = useMutation({
    mutationFn: apiService.addPortfolioItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/portfolio'] });
      setIsAddAssetOpen(false);
      setNewAsset({
        coinId: "",
        symbol: "",
        name: "",
        amount: "",
        purchasePrice: ""
      });
      toast({
        title: "Asset Added",
        description: "Your new asset has been added to your portfolio",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add asset",
        variant: "destructive",
      });
    }
  });

  // Calculate total balance and prepare chart data
  const calculatePortfolioValue = () => {
    if (!portfolio || portfolio.length === 0) {
      return {
        totalBalance: 0,
        change24h: 0,
        chartData: []
      };
    }

    let totalValue = 0;
    let totalPrevValue = 0;
    
    const chartData = portfolio.map((item: any, index: number) => {
      const currentValue = item.amount * item.purchasePrice;
      totalValue += currentValue;
      
      // For demo we'll simulate a 24h change
      const prevValue = currentValue * (1 - Math.random() * 0.1 + 0.05); // -5% to +5%
      totalPrevValue += prevValue;
      
      return {
        name: item.name,
        symbol: item.symbol,
        value: currentValue,
        amount: item.amount,
        purchasePrice: item.purchasePrice,
        color: COLORS[index % COLORS.length]
      };
    });
    
    const change24h = totalValue > 0 
      ? ((totalValue - totalPrevValue) / totalPrevValue) * 100 
      : 0;
    
    return {
      totalBalance: totalValue,
      change24h,
      chartData
    };
  };

  const { totalBalance, change24h, chartData } = calculatePortfolioValue();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input
    if (!newAsset.coinId || !newAsset.symbol || !newAsset.name || !newAsset.amount || !newAsset.purchasePrice) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    
    // Convert string inputs to numbers
    const amount = parseFloat(newAsset.amount);
    const purchasePrice = parseFloat(newAsset.purchasePrice);
    
    if (isNaN(amount) || isNaN(purchasePrice) || amount <= 0 || purchasePrice <= 0) {
      toast({
        title: "Validation Error",
        description: "Amount and purchase price must be positive numbers",
        variant: "destructive",
      });
      return;
    }
    
    addAssetMutation.mutate({
      coinId: newAsset.coinId,
      symbol: newAsset.symbol,
      name: newAsset.name,
      amount,
      purchasePrice
    });
  };

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-800 flex justify-between items-center">
        <h3 className="font-medium text-white">Your Portfolio</h3>
        <button className="text-sm text-primary-500 hover:text-primary-400">
          View All
        </button>
      </div>
      
      <div className="p-4">
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-gray-400 text-sm">Total Balance</span>
            <span className={`text-xs font-medium ${change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {change24h >= 0 ? '+' : ''}{change24h.toFixed(1)}% (24h)
            </span>
          </div>
          <div className="text-2xl font-semibold text-white">
            ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        
        {isLoading ? (
          <div className="h-32 flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-t-2 border-b-2 border-primary-600 rounded-full"></div>
          </div>
        ) : !portfolio || portfolio.length === 0 ? (
          <div className="h-32 flex flex-col items-center justify-center text-gray-400">
            <i className="ri-coin-line text-3xl mb-2"></i>
            <p className="text-sm">No assets in your portfolio</p>
          </div>
        ) : (
          <>
            <div className="h-32 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {chartData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Value']}
                    contentStyle={{ backgroundColor: '#1E1E1E', borderColor: '#4F46E5' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <ul className="space-y-3">
              {chartData.map((asset: any, index: number) => (
                <li key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: asset.color }}></div>
                    <span className="text-sm text-white">{asset.name} ({asset.symbol.toUpperCase()})</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-white">
                      ${asset.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-400">{asset.amount} {asset.symbol.toUpperCase()}</p>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
        
        <button 
          className="w-full mt-4 py-2 rounded-md bg-primary-600 hover:bg-primary-700 text-white"
          onClick={() => setIsAddAssetOpen(true)}
        >
          Add New Asset
        </button>
      </div>
      
      <Dialog open={isAddAssetOpen} onOpenChange={setIsAddAssetOpen}>
        <DialogContent className="bg-gray-900 text-white">
          <DialogHeader>
            <DialogTitle>Add New Asset</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="grid gap-2">
              <Label htmlFor="coinId">Coin ID</Label>
              <Input 
                id="coinId" 
                placeholder="e.g., bitcoin" 
                value={newAsset.coinId}
                onChange={(e) => setNewAsset({ ...newAsset, coinId: e.target.value })}
                className="bg-gray-800 border-gray-700"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="symbol">Symbol</Label>
                <Input 
                  id="symbol" 
                  placeholder="e.g., BTC" 
                  value={newAsset.symbol}
                  onChange={(e) => setNewAsset({ ...newAsset, symbol: e.target.value })}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input 
                  id="name" 
                  placeholder="e.g., Bitcoin" 
                  value={newAsset.name}
                  onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="amount">Amount</Label>
                <Input 
                  id="amount" 
                  type="number" 
                  step="any"
                  placeholder="0.00" 
                  value={newAsset.amount}
                  onChange={(e) => setNewAsset({ ...newAsset, amount: e.target.value })}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="price">Purchase Price ($)</Label>
                <Input 
                  id="price" 
                  type="number"
                  step="any"
                  placeholder="0.00" 
                  value={newAsset.purchasePrice}
                  onChange={(e) => setNewAsset({ ...newAsset, purchasePrice: e.target.value })}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
            </div>
            
            <DialogFooter className="mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsAddAssetOpen(false)}
                className="border-gray-700 text-white hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={addAssetMutation.isPending}
                className="bg-primary-600 hover:bg-primary-700"
              >
                {addAssetMutation.isPending ? "Adding..." : "Add Asset"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
