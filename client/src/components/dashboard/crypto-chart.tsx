import { useEffect, useRef, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import apiService from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

type TimeRange = "1H" | "24H" | "7D" | "1M" | "1Y";

type CryptoChartProps = {
  coinId: string;
  symbol: string;
  name: string;
  currentPrice: number;
  priceChange24h: number;
};

export default function CryptoChart({
  coinId,
  symbol,
  name,
  currentPrice,
  priceChange24h,
}: CryptoChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("24H");

  // Convert time range to days for API
  const getDaysFromTimeRange = (range: TimeRange): string => {
    switch (range) {
      case "1H": return "0.04"; // ~1 hour (1/24 of a day)
      case "24H": return "1";
      case "7D": return "7";
      case "1M": return "30";
      case "1Y": return "365";
      default: return "1";
    }
  };
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/coins', coinId, 'chart', timeRange],
    queryFn: () => apiService.getCoinChart(coinId, getDaysFromTimeRange(timeRange)),
  });
  
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
  
  const chartData = data ? formatChartData(data) : [];
  
  // Format time for x-axis
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    if (timeRange === "1H") {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (timeRange === "24H") {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (timeRange === "7D") {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else if (timeRange === "1M") {
      return date.toLocaleDateString([], { day: 'numeric', month: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short' });
    }
  };
  
  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex items-center space-x-2 mr-4">
              <img 
                src={`https://assets.coingecko.com/coins/images/${coinId}/small/${symbol.toLowerCase()}.png`} 
                alt={name}
                onError={(e) => {
                  // Fallback to placeholder if image fails to load
                  e.currentTarget.src = `https://via.placeholder.com/32x32.png?text=${symbol}`;
                }}
                className="w-6 h-6"
              />
              <h3 className="font-medium text-white">{name}</h3>
              <span className="text-gray-400 text-sm">{symbol.toUpperCase()}</span>
            </div>
            <span className="font-mono text-xl font-medium text-white">
              ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className={`ml-2 flex items-center text-sm font-medium ${priceChange24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              <i className={priceChange24h >= 0 ? 'ri-arrow-up-s-fill mr-1' : 'ri-arrow-down-s-fill mr-1'}></i>
              {Math.abs(priceChange24h).toFixed(2)}%
            </span>
          </div>
          <div className="flex space-x-2">
            {(["1H", "24H", "7D", "1M", "1Y"] as TimeRange[]).map((range) => (
              <button
                key={range}
                className={`px-3 py-1 text-xs font-medium rounded ${
                  timeRange === range 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
                onClick={() => setTimeRange(range)}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="h-60 px-4 py-3">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center">
            <Skeleton className="w-full h-full" />
          </div>
        ) : error ? (
          <div className="w-full h-full flex items-center justify-center text-red-500">
            Failed to load chart data
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="timestamp" 
                tick={{ fill: '#9CA3AF' }} 
                tickFormatter={formatTime}
                tickLine={false}
                axisLine={false}
                minTickGap={50}
              />
              <YAxis 
                domain={['auto', 'auto']}
                tick={{ fill: '#9CA3AF' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value.toLocaleString()}`}
                width={80}
              />
              <Tooltip 
                formatter={(value: number) => [`$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Price']}
                labelFormatter={(label) => new Date(label).toLocaleString()}
                contentStyle={{ backgroundColor: '#1E1E1E', borderColor: '#4F46E5' }}
              />
              <Area 
                type="monotone" 
                dataKey="price" 
                stroke="#4F46E5" 
                fillOpacity={1} 
                fill="url(#colorPrice)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
      
      <div className="px-4 pb-4 flex justify-between text-xs text-gray-400">
        {timeRange === "1H" || timeRange === "24H" ? (
          <>
            <span>09:00</span>
            <span>12:00</span>
            <span>15:00</span>
            <span>18:00</span>
            <span>21:00</span>
            <span>00:00</span>
          </>
        ) : timeRange === "7D" ? (
          <>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </>
        ) : timeRange === "1M" ? (
          <>
            <span>Week 1</span>
            <span>Week 2</span>
            <span>Week 3</span>
            <span>Week 4</span>
          </>
        ) : (
          <>
            <span>Jan</span>
            <span>Mar</span>
            <span>May</span>
            <span>Jul</span>
            <span>Sep</span>
            <span>Nov</span>
          </>
        )}
      </div>
    </div>
  );
}
