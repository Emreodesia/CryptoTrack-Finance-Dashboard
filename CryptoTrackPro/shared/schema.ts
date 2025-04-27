import { pgTable, text, serial, integer, boolean, json, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

// Portfolio table
export const portfolios = pgTable("portfolios", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  coinId: text("coin_id").notNull(), // CoinGecko ID
  symbol: text("symbol").notNull(),
  name: text("name").notNull(),
  amount: real("amount").notNull(),
  purchasePrice: real("purchase_price").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Watchlist table
export const watchlists = pgTable("watchlists", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  coinId: text("coin_id").notNull(), // CoinGecko ID
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User settings
export const userSettings = pgTable("user_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  theme: text("theme").default("dark").notNull(),
  currency: text("currency").default("usd").notNull(),
  preferences: json("preferences"),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertPortfolioSchema = createInsertSchema(portfolios).pick({
  userId: true,
  coinId: true,
  symbol: true,
  name: true,
  amount: true,
  purchasePrice: true,
});

export const insertWatchlistSchema = createInsertSchema(watchlists).pick({
  userId: true,
  coinId: true,
});

export const insertUserSettingsSchema = createInsertSchema(userSettings).pick({
  userId: true,
  theme: true,
  currency: true,
  preferences: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertPortfolio = z.infer<typeof insertPortfolioSchema>;
export type Portfolio = typeof portfolios.$inferSelect;

export type InsertWatchlist = z.infer<typeof insertWatchlistSchema>;
export type Watchlist = typeof watchlists.$inferSelect;

export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;
export type UserSettings = typeof userSettings.$inferSelect;
