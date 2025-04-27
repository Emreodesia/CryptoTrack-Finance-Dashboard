import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import axios from "axios";
import { z } from "zod";
import { insertPortfolioSchema, insertWatchlistSchema, insertUserSettingsSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";

// Helper function to handle Zod validation errors
const getZodErrorMessage = (error: any) => {
  return fromZodError(error).message;
};

// Cache for API responses to avoid rate limiting
const apiCache: { [key: string]: { data: any; timestamp: number } } = {};
const CACHE_DURATION = 60 * 1000; // 60 seconds

const COINGECKO_API_BASE = "https://api.coingecko.com/api/v3";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Get trending coins
  app.get("/api/trending", async (_req, res) => {
    try {
      const cacheKey = "trending";
      
      if (apiCache[cacheKey] && Date.now() - apiCache[cacheKey].timestamp < CACHE_DURATION) {
        return res.json(apiCache[cacheKey].data);
      }
      
      const response = await axios.get(`${COINGECKO_API_BASE}/search/trending`);
      
      apiCache[cacheKey] = {
        data: response.data,
        timestamp: Date.now()
      };
      
      res.json(response.data);
    } catch (error) {
      console.error("Error fetching trending coins:", error);
      res.status(500).json({ message: "Failed to fetch trending coins" });
    }
  });

  // Get market data
  app.get("/api/market-data", async (_req, res) => {
    try {
      const cacheKey = "market-data";
      
      if (apiCache[cacheKey] && Date.now() - apiCache[cacheKey].timestamp < CACHE_DURATION) {
        return res.json(apiCache[cacheKey].data);
      }
      
      const response = await axios.get(`${COINGECKO_API_BASE}/global`);
      
      apiCache[cacheKey] = {
        data: response.data,
        timestamp: Date.now()
      };
      
      res.json(response.data);
    } catch (error) {
      console.error("Error fetching market data:", error);
      res.status(500).json({ message: "Failed to fetch market data" });
    }
  });

  // Get top coins
  app.get("/api/coins", async (req, res) => {
    try {
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 10;
      const currency = req.query.currency || "usd";
      
      const cacheKey = `coins-${page}-${limit}-${currency}`;
      
      if (apiCache[cacheKey] && Date.now() - apiCache[cacheKey].timestamp < CACHE_DURATION) {
        return res.json(apiCache[cacheKey].data);
      }
      
      const response = await axios.get(`${COINGECKO_API_BASE}/coins/markets`, {
        params: {
          vs_currency: currency,
          order: "market_cap_desc",
          per_page: limit,
          page: page,
          sparkline: true,
          price_change_percentage: "1h,24h,7d"
        }
      });
      
      apiCache[cacheKey] = {
        data: response.data,
        timestamp: Date.now()
      };
      
      res.json(response.data);
    } catch (error) {
      console.error("Error fetching coins:", error);
      res.status(500).json({ message: "Failed to fetch coins" });
    }
  });

  // Get single coin data
  app.get("/api/coins/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const cacheKey = `coin-${id}`;
      
      if (apiCache[cacheKey] && Date.now() - apiCache[cacheKey].timestamp < CACHE_DURATION) {
        return res.json(apiCache[cacheKey].data);
      }
      
      const response = await axios.get(`${COINGECKO_API_BASE}/coins/${id}`, {
        params: {
          localization: false,
          tickers: false,
          market_data: true,
          community_data: false,
          developer_data: false
        }
      });
      
      apiCache[cacheKey] = {
        data: response.data,
        timestamp: Date.now()
      };
      
      res.json(response.data);
    } catch (error) {
      console.error(`Error fetching coin ${req.params.id}:`, error);
      res.status(500).json({ message: `Failed to fetch coin ${req.params.id}` });
    }
  });

  // Get coin chart data
  app.get("/api/coins/:id/chart", async (req, res) => {
    try {
      const { id } = req.params;
      const days = req.query.days || "1";
      const currency = req.query.currency || "usd";
      
      const cacheKey = `chart-${id}-${days}-${currency}`;
      
      if (apiCache[cacheKey] && Date.now() - apiCache[cacheKey].timestamp < CACHE_DURATION) {
        return res.json(apiCache[cacheKey].data);
      }
      
      const response = await axios.get(`${COINGECKO_API_BASE}/coins/${id}/market_chart`, {
        params: {
          vs_currency: currency,
          days: days
        }
      });
      
      apiCache[cacheKey] = {
        data: response.data,
        timestamp: Date.now()
      };
      
      res.json(response.data);
    } catch (error) {
      console.error(`Error fetching chart data for ${req.params.id}:`, error);
      res.status(500).json({ message: `Failed to fetch chart data for ${req.params.id}` });
    }
  });

  // Get cryptocurrency news
  app.get("/api/news", async (_req, res) => {
    try {
      const cacheKey = "news";
      
      if (apiCache[cacheKey] && Date.now() - apiCache[cacheKey].timestamp < CACHE_DURATION) {
        return res.json(apiCache[cacheKey].data);
      }
      
      // For demo, we'll return some static news since we don't have a news API
      const news = [
        {
          id: 1,
          title: "Bitcoin Surpasses $63K as Institutional Adoption Continues",
          summary: "The world's largest cryptocurrency by market cap has reached new heights as institutional investors continue to...",
          source: "CoinDesk",
          publishedAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
          imageUrl: "https://images.unsplash.com/photo-1621761663457-38c28f830623?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80",
          url: "https://www.coindesk.com/"
        },
        {
          id: 2,
          title: "Ethereum's Shanghai Upgrade on Track for March Release",
          summary: "Ethereum developers have confirmed the Shanghai upgrade is proceeding as planned, which will enable staked ETH withdrawals...",
          source: "The Block",
          publishedAt: new Date(Date.now() - 18000000).toISOString(), // 5 hours ago
          imageUrl: "https://images.unsplash.com/photo-1639152201720-5e6e620cce34?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80",
          url: "https://www.theblock.co/"
        }
      ];
      
      apiCache[cacheKey] = {
        data: news,
        timestamp: Date.now()
      };
      
      res.json(news);
    } catch (error) {
      console.error("Error fetching news:", error);
      res.status(500).json({ message: "Failed to fetch news" });
    }
  });

  // Portfolio endpoints
  app.get("/api/portfolio", async (req, res) => {
    try {
      // For demo, we'll use user ID 1 (guest user)
      const userId = 1;
      const portfolio = await storage.getPortfoliosByUserId(userId);
      res.json(portfolio);
    } catch (error) {
      console.error("Error fetching portfolio:", error);
      res.status(500).json({ message: "Failed to fetch portfolio" });
    }
  });

  app.post("/api/portfolio", async (req, res) => {
    try {
      // Validate the request
      const validationResult = insertPortfolioSchema.safeParse({
        ...req.body,
        userId: 1 // For demo, we'll use user ID 1 (guest user)
      });

      if (!validationResult.success) {
        const errorMessage = new ZodValidationError(validationResult.error).message;
        return res.status(400).json({ message: errorMessage });
      }

      // Add the portfolio item
      const portfolioItem = await storage.addPortfolioItem(validationResult.data);
      res.status(201).json(portfolioItem);
    } catch (error) {
      console.error("Error adding portfolio item:", error);
      res.status(500).json({ message: "Failed to add portfolio item" });
    }
  });

  app.put("/api/portfolio/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get the existing portfolio item
      const existingItem = await storage.getPortfolioItem(id);
      if (!existingItem) {
        return res.status(404).json({ message: "Portfolio item not found" });
      }
      
      // Validate the request
      const updates = req.body;
      const updatedItem = await storage.updatePortfolioItem(id, updates);
      
      res.json(updatedItem);
    } catch (error) {
      console.error("Error updating portfolio item:", error);
      res.status(500).json({ message: "Failed to update portfolio item" });
    }
  });

  app.delete("/api/portfolio/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Delete the portfolio item
      const success = await storage.deletePortfolioItem(id);
      
      if (!success) {
        return res.status(404).json({ message: "Portfolio item not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting portfolio item:", error);
      res.status(500).json({ message: "Failed to delete portfolio item" });
    }
  });

  // Watchlist endpoints
  app.get("/api/watchlist", async (_req, res) => {
    try {
      // For demo, we'll use user ID 1 (guest user)
      const userId = 1;
      const watchlist = await storage.getWatchlistByUserId(userId);
      res.json(watchlist);
    } catch (error) {
      console.error("Error fetching watchlist:", error);
      res.status(500).json({ message: "Failed to fetch watchlist" });
    }
  });

  app.post("/api/watchlist", async (req, res) => {
    try {
      // Validate the request
      const validationResult = insertWatchlistSchema.safeParse({
        ...req.body,
        userId: 1 // For demo, we'll use user ID 1 (guest user)
      });

      if (!validationResult.success) {
        const errorMessage = new ZodValidationError(validationResult.error).message;
        return res.status(400).json({ message: errorMessage });
      }

      // Add to watchlist
      const watchlistItem = await storage.addToWatchlist(validationResult.data);
      res.status(201).json(watchlistItem);
    } catch (error) {
      console.error("Error adding to watchlist:", error);
      res.status(500).json({ message: "Failed to add to watchlist" });
    }
  });

  app.delete("/api/watchlist/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Remove from watchlist
      const success = await storage.removeFromWatchlist(id);
      
      if (!success) {
        return res.status(404).json({ message: "Watchlist item not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error removing from watchlist:", error);
      res.status(500).json({ message: "Failed to remove from watchlist" });
    }
  });

  // Settings endpoints
  app.get("/api/settings", async (_req, res) => {
    try {
      // For demo, we'll use user ID 1 (guest user)
      const userId = 1;
      const settings = await storage.getUserSettings(userId);
      
      if (!settings) {
        // Create default settings if none exist
        const defaultSettings = await storage.updateUserSettings(userId, {
          userId,
          theme: "dark",
          currency: "usd",
          preferences: {}
        });
        
        return res.json(defaultSettings);
      }
      
      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.put("/api/settings", async (req, res) => {
    try {
      // For demo, we'll use user ID 1 (guest user)
      const userId = 1;
      
      // Validate the request
      const validationResult = insertUserSettingsSchema
        .omit({ userId: true })
        .partial()
        .safeParse(req.body);

      if (!validationResult.success) {
        const errorMessage = new ZodValidationError(validationResult.error).message;
        return res.status(400).json({ message: errorMessage });
      }

      // Update settings
      const settings = await storage.updateUserSettings(userId, {
        ...validationResult.data,
        userId
      });
      
      res.json(settings);
    } catch (error) {
      console.error("Error updating settings:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  return httpServer;
}
