import { createContext, useContext, useEffect, useState } from "react";
import apiService from "@/lib/api";

type ThemeContextType = {
  theme: "dark" | "light";
  currency: string;
  setCurrency: (currency: string) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [currency, setCurrency] = useState("usd");

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await apiService.getSettings();
        setTheme(settings.theme);
        setCurrency(settings.currency);
      } catch (error) {
        console.error("Failed to load settings:", error);
      }
    };

    loadSettings();
  }, []);

  const toggleTheme = async () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    try {
      await apiService.updateSettings({ theme: newTheme });
    } catch (error) {
      console.error("Failed to update theme setting:", error);
    }
  };

  const updateCurrency = async (newCurrency: string) => {
    setCurrency(newCurrency);
    try {
      await apiService.updateSettings({ currency: newCurrency });
    } catch (error) {
      console.error("Failed to update currency setting:", error);
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        currency,
        setCurrency: updateCurrency,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useThemeContext must be used within a ThemeContextProvider");
  }
  return context;
};
