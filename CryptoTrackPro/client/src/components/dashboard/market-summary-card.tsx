import { cn } from "@/lib/utils";

type MarketSummaryCardProps = {
  title: string;
  value: string;
  subValue?: string;
  change?: number;
  className?: string;
};

export default function MarketSummaryCard({ 
  title, 
  value, 
  subValue, 
  change, 
  className 
}: MarketSummaryCardProps) {
  return (
    <div className={cn("bg-gray-900 rounded-lg p-4 border border-gray-800", className)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-400">{title}</h3>
        {change !== undefined && (
          <span className={cn(
            "flex items-center text-xs font-medium",
            change >= 0 ? "text-green-500" : "text-red-500"
          )}>
            <i className={cn(
              "mr-1",
              change >= 0 ? "ri-arrow-up-s-fill" : "ri-arrow-down-s-fill"
            )}></i>
            {Math.abs(change).toFixed(1)}%
          </span>
        )}
      </div>
      <div className="flex items-end">
        <span className="text-2xl font-semibold text-white">{value}</span>
        {subValue && <span className="ml-2 text-xs text-gray-400 mb-1">{subValue}</span>}
      </div>
    </div>
  );
}
