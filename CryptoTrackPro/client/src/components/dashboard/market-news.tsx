import { useQuery } from "@tanstack/react-query";
import apiService from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

export default function MarketNews() {
  const { data: news, isLoading, error } = useQuery({
    queryKey: ['/api/news'],
    queryFn: apiService.getNews,
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

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-800">
        <h3 className="font-medium text-white">Latest News</h3>
      </div>
      
      {isLoading ? (
        <div className="p-4 space-y-4">
          {[1, 2].map((item) => (
            <Skeleton key={item} className="h-24 w-full" />
          ))}
        </div>
      ) : error ? (
        <div className="p-8 text-center text-red-500">
          Failed to load news
        </div>
      ) : news && news.length > 0 ? (
        <ul className="divide-y divide-gray-800">
          {news.map((item: any) => (
            <li key={item.id} className="p-4 hover:bg-gray-800 cursor-pointer">
              <div className="flex space-x-3">
                <img 
                  src={item.imageUrl} 
                  className="h-16 w-16 rounded object-cover" 
                  alt={item.title}
                  onError={(e) => {
                    e.currentTarget.src = `https://via.placeholder.com/100x100.png?text=News`;
                  }}
                />
                <div>
                  <h4 className="font-medium text-white text-sm mb-1">{item.title}</h4>
                  <p className="text-xs text-gray-400 mb-2 line-clamp-2">{item.summary}</p>
                  <div className="flex items-center text-xs text-gray-500">
                    <span>{item.source}</span>
                    <span className="mx-1">•</span>
                    <span>{timeAgo(item.publishedAt)}</span>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="p-8 text-center text-gray-400">
          No news available
        </div>
      )}
      
      <div className="px-4 py-3 border-t border-gray-800">
        <button className="w-full text-center text-sm text-primary-500 hover:text-primary-400">
          View All News
        </button>
      </div>
    </div>
  );
}
