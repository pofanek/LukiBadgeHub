import { createContext } from "react";

export type ThemePreference = {
  color: string;
  brightness: number;
  isDefault: boolean;
};

export type ThemeContextValue = {
  preference: ThemePreference;
  setColor: (color: string) => void;
  setBrightness: (brightness: number) => void;
  resetTheme: () => void;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);
