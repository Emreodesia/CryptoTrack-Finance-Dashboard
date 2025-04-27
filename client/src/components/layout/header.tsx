import { useState } from "react";
import { useTheme } from "@/components/ui/theme-provider";
import { Link } from "wouter";

export default function Header() {
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <header className="bg-gray-900 border-b border-gray-800 z-10">
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        {/* Mobile menu button */}
        <button 
          type="button" 
          className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 focus:outline-none"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <i className="ri-menu-line text-xl"></i>
        </button>
        
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 flex md:hidden">
            <div 
              className="fixed inset-0 bg-black bg-opacity-75 transition-opacity"
              onClick={() => setMobileMenuOpen(false)}
            ></div>
            
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-gray-900">
              <div className="px-4 pt-5 pb-4 flex items-center justify-between">
                <div className="flex items-center">
                  <i className="ri-line-chart-fill text-primary-600 text-2xl"></i>
                  <h1 className="ml-2 text-xl font-semibold text-white">CryptoTrack</h1>
                </div>
                <button
                  type="button"
                  className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <i className="ri-close-line text-gray-400 text-xl"></i>
                </button>
              </div>
              
              <div className="mt-5 flex-1 overflow-y-auto">
                <nav className="px-2 space-y-1">
                  <Link href="/">
                    <a className="group flex items-center px-2 py-2 text-base font-medium rounded-md bg-primary-700 text-white">
                      <i className="ri-dashboard-fill mr-4 text-xl"></i>
                      Overview
                    </a>
                  </Link>
                  <Link href="/portfolio">
                    <a className="group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-300 hover:bg-gray-800 hover:text-white">
                      <i className="ri-exchange-funds-fill mr-4 text-xl"></i>
                      Portfolio
                    </a>
                  </Link>
                  <Link href="/watchlist">
                    <a className="group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-300 hover:bg-gray-800 hover:text-white">
                      <i className="ri-star-fill mr-4 text-xl"></i>
                      Watchlist
                    </a>
                  </Link>
                  <Link href="/news">
                    <a className="group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-300 hover:bg-gray-800 hover:text-white">
                      <i className="ri-newspaper-fill mr-4 text-xl"></i>
                      News
                    </a>
                  </Link>
                </nav>
              </div>
            </div>
          </div>
        )}
        
        {/* Search bar */}
        <div className="relative flex-1 max-w-md mx-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <i className="ri-search-line text-gray-500"></i>
            </div>
            <input 
              type="text" 
              className="block w-full pl-10 pr-3 py-2 border border-gray-800 rounded-md bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-primary-600 sm:text-sm" 
              placeholder="Search coins, news..."
            />
          </div>
        </div>
        
        {/* Right-side header items */}
        <div className="flex items-center space-x-4">
          {/* Theme toggle */}
          <button 
            className="p-1.5 rounded-full bg-gray-800 text-gray-400 hover:text-white" 
            aria-label="Toggle dark/light mode"
            onClick={toggleTheme}
          >
            {theme === 'dark' ? (
              <i className="ri-sun-line text-lg"></i>
            ) : (
              <i className="ri-moon-line text-lg"></i>
            )}
          </button>
          
          {/* Notifications */}
          <button className="p-1.5 rounded-full bg-gray-800 text-gray-400 hover:text-white relative" aria-label="Notifications">
            <i className="ri-notification-3-line text-lg"></i>
            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500"></span>
          </button>
          
          {/* User menu */}
          <div className="relative">
            <button className="flex text-sm border-2 border-transparent rounded-full focus:outline-none focus:border-primary-600" id="user-menu-button">
              <img 
                className="h-8 w-8 rounded-full object-cover" 
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" 
                alt="User avatar"
              />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
