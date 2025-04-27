import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import apiService from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

type CryptoTableProps = {
  limit?: number;
};

export default function CryptoTable({ limit = 5 }: CryptoTableProps) {
  const [page, setPage] = useState(1);
  const [currency, setCurrency] = useState("usd");
  const [category, setCategory] = useState("all");
  
  const { data: coins, isLoading, error } = useQuery({
    queryKey: ['/api/coins', page, limit, currency],
    queryFn: () => apiService.getCoins(page, limit, currency),
  });
  
  // Format number to compact form (e.g., 1.2B)
  const formatNumber = (num: number) => {
    if (num >= 1e9) {
      return (num / 1e9).toFixed(1) + "B";
    } else if (num >= 1e6) {
      return (num / 1e6).toFixed(1) + "M";
    } else if (num >= 1e3) {
      return (num / 1e3).toFixed(1) + "K";
    }
    return num.toString();
  };
  
  // Format sparkline data for the 7-day chart
  const formatSparklineData = (sparkline: number[]) => {
    if (!sparkline) return [];
    
    return sparkline.map((price, index) => ({
      timestamp: index,
      price,
    }));
  };

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-800 flex justify-between items-center">
        <h3 className="font-medium text-white">Top Cryptocurrencies</h3>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <select 
              className="appearance-none bg-gray-800 border border-gray-800 rounded-md py-1.5 pl-3 pr-8 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary-600 focus:border-primary-600"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              <option value="defi">DeFi</option>
              <option value="nft">NFTs</option>
              <option value="smart-contract">Smart Contract</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
              <i className="ri-arrow-down-s-line"></i>
            </div>
          </div>
          <button 
            className="p-1.5 rounded-md bg-gray-800 text-gray-400 hover:text-white"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['/api/coins'] });
            }}
          >
            <i className="ri-refresh-line text-lg"></i>
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-800">
          <thead className="bg-gray-800">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                #
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Coin
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                Price
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                24h %
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                7d %
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                Market Cap
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                Volume (24h)
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                Last 7 Days
              </th>
            </tr>
          </thead>
          
          <tbody className="bg-gray-900 divide-y divide-gray-800">
            {isLoading ? (
              Array(limit).fill(0).map((_, index) => (
                <tr key={index}>
                  <td colSpan={8} className="px-4 py-4">
                    <Skeleton className="h-10 w-full" />
                  </td>
                </tr>
              ))
            ) : error ? (
              <tr>
                <td colSpan={8} className="px-4 py-4 text-center text-red-500">
                  Failed to load cryptocurrency data
                </td>
              </tr>
            ) : coins && coins.length > 0 ? (
              coins.map((coin: any, index: number) => (
                <tr key={coin.id} className="hover:bg-gray-800">
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-400">
                    {(page - 1) * limit + index + 1}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img 
                        className="h-8 w-8 mr-3" 
                        src={coin.image} 
                        alt={coin.name}
                        onError={(e) => {
                          e.currentTarget.src = `https://via.placeholder.com/32x32.png?text=${coin.symbol}`;
                        }}
                      />
                      <div>
                        <div className="text-sm font-medium text-white">{coin.name}</div>
                        <div className="text-xs text-gray-400">{coin.symbol.toUpperCase()}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-mono font-medium text-white">
                    ${coin.current_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right text-sm">
                    <span className={coin.price_change_percentage_24h >= 0 ? 'text-green-500' : 'text-red-500'}>
                      {coin.price_change_percentage_24h >= 0 ? '+' : ''}
                      {coin.price_change_percentage_24h?.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right text-sm">
                    <span className={coin.price_change_percentage_7d_in_currency >= 0 ? 'text-green-500' : 'text-red-500'}>
                      {coin.price_change_percentage_7d_in_currency >= 0 ? '+' : ''}
                      {coin.price_change_percentage_7d_in_currency?.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right text-sm text-white">
                    ${formatNumber(coin.market_cap)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right text-sm text-white">
                    ${formatNumber(coin.total_volume)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right">
                    <div className="w-24 h-10 inline-block">
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
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="px-4 py-4 text-center text-gray-400">
                  No data found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="px-4 py-3 border-t border-gray-800 flex items-center justify-between">
        <div className="text-sm text-gray-400">
          Showing <span className="font-medium text-white">{(page - 1) * limit + 1}</span> to{" "}
          <span className="font-medium text-white">
            {page * limit > (coins?.length || 0) ? coins?.length || 0 : page * limit}
          </span> of <span className="font-medium text-white">100</span> results
        </div>
        <div className="flex items-center space-x-2">
          <button 
            className={`px-3 py-1.5 border border-gray-800 rounded-md text-sm text-gray-400 bg-gray-800 hover:text-white disabled:opacity-50`}
            onClick={() => setPage(page => Math.max(1, page - 1))}
            disabled={page === 1}
          >
            Previous
          </button>
          <button 
            className="px-3 py-1.5 border border-gray-800 rounded-md text-sm text-white bg-gray-800 hover:bg-gray-700"
            onClick={() => setPage(page => page + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
