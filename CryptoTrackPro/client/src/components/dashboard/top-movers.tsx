import { useQuery } from "@tanstack/react-query";
import apiService from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

type MoversCardProps = {
  title: string;
  filter: (coins: any[]) => any[];
};

function getCoinImage(id: string, symbol: string) {
  return `https://assets.coingecko.com/coins/images/${id}/small/${symbol.toLowerCase()}.png`;
}

export function MoversCard({ title, filter }: MoversCardProps) {
  const { data: coins, isLoading, error } = useQuery({
    queryKey: ['/api/coins', 1, 50, 'usd'],
    queryFn: () => apiService.getCoins(1, 50, 'usd'),
  });
  
  const filteredCoins = coins ? filter(coins).slice(0, 3) : [];

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-800">
        <h3 className="font-medium text-white">{title}</h3>
      </div>
      <ul className="divide-y divide-gray-800">
        {isLoading ? (
          Array(3).fill(0).map((_, index) => (
            <li key={index} className="px-4 py-3">
              <Skeleton className="h-16 w-full" />
            </li>
          ))
        ) : error ? (
          <li className="px-4 py-3 text-center text-red-500">
            Failed to load data
          </li>
        ) : filteredCoins.length === 0 ? (
          <li className="px-4 py-3 text-center text-gray-400">
            No data available
          </li>
        ) : (
          filteredCoins.map((coin) => (
            <li key={coin.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-800 cursor-pointer">
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
                  <h4 className="font-medium text-white">{coin.name}</h4>
                  <p className="text-xs text-gray-400">{coin.symbol.toUpperCase()}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-mono font-medium text-white">
                  ${coin.current_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
                </p>
                <p className={`text-sm flex items-center justify-end ${coin.price_change_percentage_24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  <i className={coin.price_change_percentage_24h >= 0 ? 'ri-arrow-up-s-fill' : 'ri-arrow-down-s-fill'}></i>
                  {Math.abs(coin.price_change_percentage_24h).toFixed(1)}%
                </p>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

export function TopGainers() {
  const filterGainers = (coins: any[]) => {
    return [...coins]
      .filter(coin => coin.price_change_percentage_24h > 0)
      .sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h);
  };
  
  return <MoversCard title="Top Gainers (24h)" filter={filterGainers} />;
}

export function TopLosers() {
  const filterLosers = (coins: any[]) => {
    return [...coins]
      .filter(coin => coin.price_change_percentage_24h < 0)
      .sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h);
  };
  
  return <MoversCard title="Top Losers (24h)" filter={filterLosers} />;
}
