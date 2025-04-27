import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  icon: string;
  href: string;
};

const dashboardLinks: NavItem[] = [
  { label: "Overview", icon: "ri-dashboard-fill", href: "/" },
  { label: "Portfolio", icon: "ri-exchange-funds-fill", href: "/portfolio" },
  { label: "Watchlist", icon: "ri-star-fill", href: "/watchlist" },
  { label: "News", icon: "ri-newspaper-fill", href: "/news" },
];

const marketLinks: NavItem[] = [
  { label: "Cryptocurrencies", icon: "ri-coin-fill", href: "/cryptocurrencies" },
  { label: "Exchanges", icon: "ri-exchange-fill", href: "/exchanges" },
  { label: "Learn", icon: "ri-book-open-fill", href: "/learn" },
];

const settingsLinks: NavItem[] = [
  { label: "Preferences", icon: "ri-settings-3-fill", href: "/preferences" },
  { label: "Account", icon: "ri-user-settings-fill", href: "/account" },
];

export default function Sidebar() {
  const [location] = useLocation();

  const NavLink = ({ item }: { item: NavItem }) => {
    const isActive = location === item.href;
    
    return (
      <Link href={item.href}>
        <a className={cn(
          "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
          isActive 
            ? "bg-primary-700 text-white" 
            : "text-gray-300 hover:bg-gray-800 hover:text-white"
        )}>
          <i className={cn(item.icon, "mr-3 text-lg")}></i>
          {item.label}
        </a>
      </Link>
    );
  };

  return (
    <aside className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64 bg-gray-900 border-r border-gray-800">
        <div className="h-16 flex items-center px-6 border-b border-gray-800">
          <div className="flex items-center space-x-2">
            <i className="ri-line-chart-fill text-primary-600 text-2xl"></i>
            <h1 className="text-xl font-semibold text-white">CryptoTrack</h1>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto pt-4">
          <div className="px-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Dashboard</h3>
            <div className="space-y-1">
              {dashboardLinks.map((item) => (
                <NavLink key={item.href} item={item} />
              ))}
            </div>
          </div>
          
          <div className="mt-6 px-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Market</h3>
            <div className="space-y-1">
              {marketLinks.map((item) => (
                <NavLink key={item.href} item={item} />
              ))}
            </div>
          </div>
          
          <div className="mt-6 px-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Settings</h3>
            <div className="space-y-1">
              {settingsLinks.map((item) => (
                <NavLink key={item.href} item={item} />
              ))}
            </div>
          </div>
        </nav>

        <div className="p-4 border-t border-gray-800">
          <div className="bg-gray-800 p-3 rounded-lg">
            <div className="flex items-center mb-2">
              <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center text-white">
                <i className="ri-user-fill"></i>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white">Guest User</p>
                <p className="text-xs text-gray-400">Free Plan</p>
              </div>
            </div>
            <button className="w-full mt-1 py-1.5 px-3 rounded-md bg-primary-600 hover:bg-primary-700 text-white text-sm">
              Upgrade to Pro
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
