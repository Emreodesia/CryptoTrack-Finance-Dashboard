import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import apiService from "@/lib/api";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

// Colors for the charts
const COLORS = ["#4F46E5", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16"];

export default function Portfolio() {
  const { toast } = useToast();
  const [isAddAssetOpen, setIsAddAssetOpen] = useState(false);
  const [isEditAssetOpen, setIsEditAssetOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [newAsset, setNewAsset] = useState({
    coinId: "",
    symbol: "",
    name: "",
    amount: "",
    purchasePrice: ""
  });
  const [editAsset, setEditAsset] = useState({
    id: 0,
    amount: "",
    purchasePrice: ""
  });

  // Fetch portfolio data
  const { data: portfolio, isLoading: isPortfolioLoading } = useQuery({
    queryKey: ['/api/portfolio'],
    queryFn: apiService.getPortfolio,
  });

  // Fetch coin data to get current prices
  const { data: coins, isLoading: isCoinsLoading } = useQuery({
    queryKey: ['/api/coins', 1, 100, 'usd'],
    queryFn: () => apiService.getCoins(1, 100, 'usd'),
    enabled: !!portfolio && portfolio.length > 0,
  });

  // Mutations
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

  const updateAssetMutation = useMutation({
    mutationFn: (data: { id: number, updates: any }) => apiService.updatePortfolioItem(data.id, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/portfolio'] });
      setIsEditAssetOpen(false);
      setSelectedAsset(null);
      toast({
        title: "Asset Updated",
        description: "Your asset has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update asset",
        variant: "destructive",
      });
    }
  });

  const deleteAssetMutation = useMutation({
    mutationFn: apiService.deletePortfolioItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/portfolio'] });
      toast({
        title: "Asset Deleted",
        description: "Asset has been removed from your portfolio",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete asset",
        variant: "destructive",
      });
    }
  });

  // Process portfolio data
  const processPortfolioData = () => {
    if (!portfolio || !coins) return { portfolioWithPrices: [], totalValue: 0, totalProfit: 0, pieChartData: [], barChartData: [] };

    const portfolioWithPrices = portfolio.map((item: any) => {
      const coin = coins.find((c: any) => c.id === item.coinId);
      const currentPrice = coin ? coin.current_price : 0;
      const currentValue = item.amount * currentPrice;
      const purchaseValue = item.amount * item.purchasePrice;
      const profit = currentValue - purchaseValue;
      const profitPercentage = purchaseValue > 0 ? (profit / purchaseValue) * 100 : 0;

      return {
        ...item,
        currentPrice,
        currentValue,
        purchaseValue,
        profit,
        profitPercentage
      };
    });

    const totalValue = portfolioWithPrices.reduce((sum: number, item: any) => sum + item.currentValue, 0);
    const totalProfit = portfolioWithPrices.reduce((sum: number, item: any) => sum + item.profit, 0);

    // Prepare data for pie chart
    const pieChartData = portfolioWithPrices.map((item: any, index: number) => ({
      name: item.name,
      value: item.currentValue,
      color: COLORS[index % COLORS.length]
    }));

    // Prepare data for bar chart (profit/loss by asset)
    const barChartData = portfolioWithPrices.map((item: any) => ({
      name: item.symbol.toUpperCase(),
      profit: item.profit,
      profitPercentage: item.profitPercentage
    }));

    return { portfolioWithPrices, totalValue, totalProfit, pieChartData, barChartData };
  };

  const { portfolioWithPrices, totalValue, totalProfit, pieChartData, barChartData } = processPortfolioData();

  const handleSubmitAdd = (e: React.FormEvent) => {
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

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input
    if (!editAsset.amount || !editAsset.purchasePrice) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    
    // Convert string inputs to numbers
    const amount = parseFloat(editAsset.amount);
    const purchasePrice = parseFloat(editAsset.purchasePrice);
    
    if (isNaN(amount) || isNaN(purchasePrice) || amount <= 0 || purchasePrice <= 0) {
      toast({
        title: "Validation Error",
        description: "Amount and purchase price must be positive numbers",
        variant: "destructive",
      });
      return;
    }
    
    updateAssetMutation.mutate({
      id: editAsset.id,
      updates: {
        amount,
        purchasePrice
      }
    });
  };

  const openEditDialog = (asset: any) => {
    setSelectedAsset(asset);
    setEditAsset({
      id: asset.id,
      amount: asset.amount.toString(),
      purchasePrice: asset.purchasePrice.toString()
    });
    setIsEditAssetOpen(true);
  };

  const handleDeleteAsset = (id: number) => {
    if (window.confirm("Are you sure you want to delete this asset?")) {
      deleteAssetMutation.mutate(id);
    }
  };

  const isLoading = isPortfolioLoading || isCoinsLoading;

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
                <h1 className="text-2xl font-semibold text-white">Portfolio</h1>
                <p className="mt-1 text-sm text-gray-400">Track and manage your cryptocurrency investments</p>
              </div>
              <div className="mt-4 md:mt-0 flex space-x-3">
                <Button
                  variant="outline"
                  className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/portfolio'] })}
                >
                  <i className="ri-refresh-line mr-2"></i> Refresh
                </Button>
                <Button
                  className="bg-primary-600 hover:bg-primary-700"
                  onClick={() => setIsAddAssetOpen(true)}
                >
                  <i className="ri-add-line mr-2"></i> Add Asset
                </Button>
              </div>
            </div>
          </div>

          {/* Portfolio Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Total Portfolio Value</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-28" />
                ) : (
                  <div className="text-2xl font-bold text-white">
                    ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Total Profit/Loss</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-28" />
                ) : (
                  <div className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {totalProfit >= 0 ? '+' : ''}${totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Assets</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-28" />
                ) : (
                  <div className="text-2xl font-bold text-white">
                    {portfolioWithPrices.length}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Portfolio Visualizations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Distribution Pie Chart */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Portfolio Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-64 flex items-center justify-center">
                    <div className="animate-spin w-10 h-10 border-t-2 border-b-2 border-primary-600 rounded-full"></div>
                  </div>
                ) : !portfolio || portfolio.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-gray-400">
                    <i className="ri-pie-chart-line text-4xl mb-2"></i>
                    <p>No assets in your portfolio</p>
                  </div>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {pieChartData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => [`$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Value']}
                          contentStyle={{ backgroundColor: '#1E1E1E', borderColor: '#4F46E5' }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Profit/Loss Bar Chart */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Profit/Loss by Asset</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-64 flex items-center justify-center">
                    <div className="animate-spin w-10 h-10 border-t-2 border-b-2 border-primary-600 rounded-full"></div>
                  </div>
                ) : !portfolio || portfolio.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-gray-400">
                    <i className="ri-bar-chart-line text-4xl mb-2"></i>
                    <p>No assets in your portfolio</p>
                  </div>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barChartData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="name" tick={{ fill: '#9CA3AF' }} />
                        <YAxis tick={{ fill: '#9CA3AF' }} />
                        <Tooltip
                          formatter={(value: number) => [`$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Profit/Loss']}
                          contentStyle={{ backgroundColor: '#1E1E1E', borderColor: '#4F46E5' }}
                        />
                        <Bar 
                          dataKey="profit" 
                          fill="#4F46E5"
                          name="Profit/Loss"
                          barSize={30}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Portfolio Table */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Your Assets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gray-800">
                    <TableRow>
                      <TableHead>Asset</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Purchase Price</TableHead>
                      <TableHead className="text-right">Current Price</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                      <TableHead className="text-right">Profit/Loss</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array(3).fill(0).map((_, index) => (
                        <TableRow key={index}>
                          <TableCell colSpan={7}>
                            <Skeleton className="h-10 w-full" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : !portfolioWithPrices || portfolioWithPrices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-10 text-gray-400">
                          <div className="flex flex-col items-center">
                            <i className="ri-coin-line text-4xl mb-2"></i>
                            <p>No assets in your portfolio</p>
                            <Button 
                              className="mt-4 bg-primary-600 hover:bg-primary-700"
                              onClick={() => setIsAddAssetOpen(true)}
                            >
                              Add Your First Asset
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      portfolioWithPrices.map((asset: any) => (
                        <TableRow key={asset.id} className="hover:bg-gray-800">
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              {/* Try to get an image by constructing a common coin image URL pattern */}
                              <img 
                                src={`https://assets.coingecko.com/coins/images/${asset.coinId}/small/${asset.symbol.toLowerCase()}.png`}
                                onError={(e) => {
                                  // Fallback to placeholder if image fails to load
                                  e.currentTarget.src = `https://via.placeholder.com/24x24.png?text=${asset.symbol.substring(0, 2).toUpperCase()}`;
                                }}
                                alt={asset.name}
                                className="w-6 h-6 mr-2"
                              />
                              <div>
                                <div className="text-white">{asset.name}</div>
                                <div className="text-xs text-gray-400">{asset.symbol.toUpperCase()}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {asset.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            ${asset.purchasePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            ${asset.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            ${asset.currentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className={`text-right font-mono ${asset.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {asset.profit >= 0 ? '+' : ''}${asset.profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            <div className="text-xs">
                              ({asset.profitPercentage >= 0 ? '+' : ''}{asset.profitPercentage.toFixed(2)}%)
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="h-8 px-2 text-gray-400 border-gray-700 hover:text-white hover:bg-gray-700"
                                onClick={() => openEditDialog(asset)}
                              >
                                <i className="ri-edit-line text-base"></i>
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="h-8 px-2 text-red-500 border-gray-700 hover:text-white hover:bg-red-600"
                                onClick={() => handleDeleteAsset(asset.id)}
                              >
                                <i className="ri-delete-bin-line text-base"></i>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Add Asset Dialog */}
          <Dialog open={isAddAssetOpen} onOpenChange={setIsAddAssetOpen}>
            <DialogContent className="bg-gray-900 text-white border-gray-800">
              <DialogHeader>
                <DialogTitle>Add New Asset</DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmitAdd} className="space-y-4 mt-2">
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

          {/* Edit Asset Dialog */}
          <Dialog open={isEditAssetOpen} onOpenChange={setIsEditAssetOpen}>
            <DialogContent className="bg-gray-900 text-white border-gray-800">
              <DialogHeader>
                <DialogTitle>Edit Asset</DialogTitle>
              </DialogHeader>
              
              {selectedAsset && (
                <form onSubmit={handleSubmitEdit} className="space-y-4 mt-2">
                  <div className="flex items-center mb-4">
                    <img 
                      src={`https://assets.coingecko.com/coins/images/${selectedAsset.coinId}/small/${selectedAsset.symbol.toLowerCase()}.png`}
                      onError={(e) => {
                        e.currentTarget.src = `https://via.placeholder.com/32x32.png?text=${selectedAsset.symbol.substring(0, 2).toUpperCase()}`;
                      }}
                      alt={selectedAsset.name}
                      className="w-8 h-8 mr-3"
                    />
                    <div>
                      <div className="text-lg font-medium text-white">{selectedAsset.name}</div>
                      <div className="text-sm text-gray-400">{selectedAsset.symbol.toUpperCase()}</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-amount">Amount</Label>
                      <Input 
                        id="edit-amount" 
                        type="number" 
                        step="any"
                        placeholder="0.00" 
                        value={editAsset.amount}
                        onChange={(e) => setEditAsset({ ...editAsset, amount: e.target.value })}
                        className="bg-gray-800 border-gray-700"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-price">Purchase Price ($)</Label>
                      <Input 
                        id="edit-price" 
                        type="number"
                        step="any"
                        placeholder="0.00" 
                        value={editAsset.purchasePrice}
                        onChange={(e) => setEditAsset({ ...editAsset, purchasePrice: e.target.value })}
                        className="bg-gray-800 border-gray-700"
                      />
                    </div>
                  </div>
                  
                  <DialogFooter className="mt-6">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsEditAssetOpen(false)}
                      className="border-gray-700 text-white hover:bg-gray-800"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={updateAssetMutation.isPending}
                      className="bg-primary-600 hover:bg-primary-700"
                    >
                      {updateAssetMutation.isPending ? "Updating..." : "Update Asset"}
                    </Button>
                  </DialogFooter>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
