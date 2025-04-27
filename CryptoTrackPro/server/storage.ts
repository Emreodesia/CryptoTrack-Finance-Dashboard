import { 
  users, type User, type InsertUser,
  portfolios, type Portfolio, type InsertPortfolio,
  watchlists, type Watchlist, type InsertWatchlist,
  userSettings, type UserSettings, type InsertUserSettings
} from "@shared/schema";

// Storage interface
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Portfolio methods
  getPortfoliosByUserId(userId: number): Promise<Portfolio[]>;
  getPortfolioItem(id: number): Promise<Portfolio | undefined>;
  addPortfolioItem(portfolio: InsertPortfolio): Promise<Portfolio>;
  updatePortfolioItem(id: number, portfolio: Partial<InsertPortfolio>): Promise<Portfolio | undefined>;
  deletePortfolioItem(id: number): Promise<boolean>;

  // Watchlist methods
  getWatchlistByUserId(userId: number): Promise<Watchlist[]>;
  addToWatchlist(watchlist: InsertWatchlist): Promise<Watchlist>;
  removeFromWatchlist(id: number): Promise<boolean>;
  isInWatchlist(userId: number, coinId: string): Promise<boolean>;

  // User settings methods
  getUserSettings(userId: number): Promise<UserSettings | undefined>;
  updateUserSettings(userId: number, settings: Partial<InsertUserSettings>): Promise<UserSettings | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private portfolios: Map<number, Portfolio>;
  private watchlists: Map<number, Watchlist>;
  private userSettings: Map<number, UserSettings>;
  private currentUserId: number;
  private currentPortfolioId: number;
  private currentWatchlistId: number;
  private currentUserSettingsId: number;

  constructor() {
    this.users = new Map();
    this.portfolios = new Map();
    this.watchlists = new Map();
    this.userSettings = new Map();
    this.currentUserId = 1;
    this.currentPortfolioId = 1;
    this.currentWatchlistId = 1;
    this.currentUserSettingsId = 1;

    // Add a guest user for demo purposes
    this.createUser({ username: "guest", password: "password" });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    
    // Create default user settings
    this.updateUserSettings(id, {
      userId: id,
      theme: "dark",
      currency: "usd",
      preferences: {}
    });
    
    return user;
  }

  // Portfolio methods
  async getPortfoliosByUserId(userId: number): Promise<Portfolio[]> {
    return Array.from(this.portfolios.values()).filter(
      (portfolio) => portfolio.userId === userId
    );
  }

  async getPortfolioItem(id: number): Promise<Portfolio | undefined> {
    return this.portfolios.get(id);
  }

  async addPortfolioItem(insertPortfolio: InsertPortfolio): Promise<Portfolio> {
    const id = this.currentPortfolioId++;
    const now = new Date();
    const portfolio: Portfolio = { 
      ...insertPortfolio, 
      id,
      createdAt: now
    };
    this.portfolios.set(id, portfolio);
    return portfolio;
  }

  async updatePortfolioItem(id: number, updates: Partial<InsertPortfolio>): Promise<Portfolio | undefined> {
    const portfolio = this.portfolios.get(id);
    if (!portfolio) return undefined;
    
    const updatedPortfolio: Portfolio = { 
      ...portfolio, 
      ...updates,
    };
    this.portfolios.set(id, updatedPortfolio);
    return updatedPortfolio;
  }

  async deletePortfolioItem(id: number): Promise<boolean> {
    return this.portfolios.delete(id);
  }

  // Watchlist methods
  async getWatchlistByUserId(userId: number): Promise<Watchlist[]> {
    return Array.from(this.watchlists.values()).filter(
      (watchlist) => watchlist.userId === userId
    );
  }

  async addToWatchlist(insertWatchlist: InsertWatchlist): Promise<Watchlist> {
    // Check if already in watchlist
    const existingItem = Array.from(this.watchlists.values()).find(
      (w) => w.userId === insertWatchlist.userId && w.coinId === insertWatchlist.coinId
    );
    
    if (existingItem) {
      return existingItem;
    }
    
    const id = this.currentWatchlistId++;
    const now = new Date();
    const watchlist: Watchlist = { 
      ...insertWatchlist, 
      id,
      createdAt: now
    };
    this.watchlists.set(id, watchlist);
    return watchlist;
  }

  async removeFromWatchlist(id: number): Promise<boolean> {
    return this.watchlists.delete(id);
  }

  async isInWatchlist(userId: number, coinId: string): Promise<boolean> {
    return Array.from(this.watchlists.values()).some(
      (w) => w.userId === userId && w.coinId === coinId
    );
  }

  // User settings methods
  async getUserSettings(userId: number): Promise<UserSettings | undefined> {
    return Array.from(this.userSettings.values()).find(
      (settings) => settings.userId === userId
    );
  }

  async updateUserSettings(userId: number, updates: Partial<InsertUserSettings>): Promise<UserSettings | undefined> {
    let settings = await this.getUserSettings(userId);
    
    if (!settings) {
      // Create new settings
      const id = this.currentUserSettingsId++;
      settings = {
        id,
        userId,
        theme: updates.theme || "dark",
        currency: updates.currency || "usd",
        preferences: updates.preferences || {}
      };
    } else {
      // Update existing settings
      settings = {
        ...settings,
        ...updates
      };
    }
    
    this.userSettings.set(settings.id, settings);
    return settings;
  }
}

export const storage = new MemStorage();
