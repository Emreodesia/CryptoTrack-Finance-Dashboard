import axios from "axios";

// Base API URL
const API_URL = "/api";

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Market data
export const getMarketData = async () => {
  const response = await api.get("/market-data");
  return response.data;
};

// Coins
export const getCoins = async (page = 1, limit = 10, currency = "usd") => {
  const response = await api.get("/coins", {
    params: { page, limit, currency },
  });
  return response.data;
};

export const getCoin = async (id: string) => {
  const response = await api.get(`/coins/${id}`);
  return response.data;
};

export const getCoinChart = async (id: string, days = "1", currency = "usd") => {
  const response = await api.get(`/coins/${id}/chart`, {
    params: { days, currency },
  });
  return response.data;
};

// Portfolio
export const getPortfolio = async () => {
  const response = await api.get("/portfolio");
  return response.data;
};

export const addPortfolioItem = async (data: {
  coinId: string;
  symbol: string;
  name: string;
  amount: number;
  purchasePrice: number;
}) => {
  const response = await api.post("/portfolio", data);
  return response.data;
};

export const updatePortfolioItem = async (id: number, data: Partial<{
  amount: number;
  purchasePrice: number;
}>) => {
  const response = await api.put(`/portfolio/${id}`, data);
  return response.data;
};

export const deletePortfolioItem = async (id: number) => {
  await api.delete(`/portfolio/${id}`);
  return true;
};

// Watchlist
export const getWatchlist = async () => {
  const response = await api.get("/watchlist");
  return response.data;
};

export const addToWatchlist = async (coinId: string) => {
  const response = await api.post("/watchlist", { coinId });
  return response.data;
};

export const removeFromWatchlist = async (id: number) => {
  await api.delete(`/watchlist/${id}`);
  return true;
};

// News
export const getNews = async () => {
  const response = await api.get("/news");
  return response.data;
};

// Settings
export const getSettings = async () => {
  const response = await api.get("/settings");
  return response.data;
};

export const updateSettings = async (data: Partial<{
  theme: "dark" | "light";
  currency: string;
  preferences: Record<string, unknown>;
}>) => {
  const response = await api.put("/settings", data);
  return response.data;
};

// Trending
export const getTrending = async () => {
  const response = await api.get("/trending");
  return response.data;
};

// Export the API service
const apiService = {
  getMarketData,
  getCoins,
  getCoin,
  getCoinChart,
  getPortfolio,
  addPortfolioItem,
  updatePortfolioItem,
  deletePortfolioItem,
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  getNews,
  getSettings,
  updateSettings,
  getTrending,
};

export default apiService;
