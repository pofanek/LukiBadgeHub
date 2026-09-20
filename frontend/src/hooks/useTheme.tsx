import { useEffect, useMemo, useState } from "react";
import { clamp, hexToRgb } from "../utils/themeColors";
import { ThemeContext, type ThemeContextValue, type ThemePreference } from "./themeContext";

const THEME_STORAGE_KEY = "luki-badge-hub-theme";
const defaultTheme: ThemePreference = {
  color: "#3d8ef0",
  brightness: 64,
  isDefault: true,
};

const themeProperties = [
  "--color-primary",
  "--color-brand-primary",
  "--color-brand-secondary",
  "--color-brand-tertiary",
  "--color-font-primary",
  "--color-font-secondary",
  "--color-font-muted",
  "--color-font-muted-2",
  "--color-hover",
  "--color-link-primary",
  "--color-link-secondary",
  "--color-effect-glass",
  "--shadow-black",
  "--color-surface",
  "--color-surface-soft",
  "--color-surface-raised",
  "--color-surface-overlay",
  "--color-border",
  "--color-accent-cold",
  "--color-accent-cold-dim",
  "--bg-image",
] as const;

function rgbToHsl({ red, green, blue }: NonNullable<ReturnType<typeof hexToRgb>>) {
  const normalizedRed = red / 255;
  const normalizedGreen = green / 255;
  const normalizedBlue = blue / 255;
  const maximum = Math.max(normalizedRed, normalizedGreen, normalizedBlue);
  const minimum = Math.min(normalizedRed, normalizedGreen, normalizedBlue);
  const lightness = (maximum + minimum) / 2;
  const difference = maximum - minimum;

  if (difference === 0) return { hue: 0, saturation: 0, lightness: lightness * 100 };

  const saturation = difference / (1 - Math.abs(2 * lightness - 1));
  let hue = 0;
  if (maximum === normalizedRed) hue = ((normalizedGreen - normalizedBlue) / difference) % 6;
  else if (maximum === normalizedGreen) hue = (normalizedBlue - normalizedRed) / difference + 2;
  else hue = (normalizedRed - normalizedGreen) / difference + 4;

  return {
    hue: ((hue * 60) + 360) % 360,
    saturation: saturation * 100,
    lightness: lightness * 100,
  };
}

function hsl(hue: number, saturation: number, lightness: number) {
  return `hsl(${Math.round(hue)} ${Math.round(saturation)}% ${Math.round(lightness)}%)`;
}

function customThemeVariables(preference: ThemePreference) {
  const rgb = hexToRgb(preference.color) || hexToRgb(defaultTheme.color)!;
  const selected = rgbToHsl(rgb);
  const hue = selected.hue;
  const saturation = Math.max(selected.saturation, 52);
  const depth = clamp(preference.brightness, 0, 100);
  const primaryLightness = 3 + depth * 0.11;

  return {
    "--color-primary": hsl(hue, Math.min(saturation, 42), primaryLightness),
    "--color-brand-primary": hsl(hue, Math.min(saturation, 58), primaryLightness + 16),
    "--color-brand-secondary": hsl(hue, Math.min(saturation, 54), primaryLightness + 12),
    "--color-brand-tertiary": hsl(hue, Math.min(saturation, 48), primaryLightness + 8),
    "--color-font-primary": hsl(hue, Math.min(saturation, 32), 94),
    "--color-font-secondary": hsl(hue, Math.min(saturation, 38), 76),
    "--color-font-muted": hsl(hue, Math.min(saturation, 32), 61),
    "--color-font-muted-2": hsl(hue, Math.min(saturation, 26), 45),
    "--color-hover": hsl(hue, Math.min(saturation + 10, 88), 78),
    "--color-link-primary": hsl(hue, Math.min(saturation + 8, 88), 62),
    "--color-link-secondary": hsl(hue, Math.min(saturation, 82), 70),
    "--color-effect-glass": `hsl(${Math.round(hue)} ${Math.round(Math.min(saturation, 52))}% 92% / 0.06)`,
    "--shadow-black": `0 8px 28px hsl(${Math.round(hue)} 38% 2% / 0.92)`,
    "--color-surface": hsl(hue, Math.min(saturation, 35), primaryLightness + 4),
    "--color-surface-soft": hsl(hue, Math.min(saturation, 38), primaryLightness + 8),
    "--color-surface-raised": hsl(hue, Math.min(saturation, 42), primaryLightness + 12),
    "--color-surface-overlay": hsl(hue, Math.min(saturation, 34), Math.max(2, primaryLightness - 2)),
    "--color-border": `hsl(${Math.round(hue)} ${Math.round(Math.min(saturation, 48))}% 76% / 0.16)`,
    "--color-accent-cold": hsl(hue, Math.min(saturation + 10, 92), 62),
    "--color-accent-cold-dim": hsl(hue, Math.min(saturation, 84), 56),
    "--bg-image": "none",
  };
}

function readStoredTheme(): ThemePreference {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (!stored) return defaultTheme;
    const parsed = JSON.parse(stored) as Partial<ThemePreference>;
    if (typeof parsed.color !== "string" || typeof parsed.brightness !== "number" || parsed.isDefault !== false) return defaultTheme;
    if (!hexToRgb(parsed.color)) return defaultTheme;
    return {
      color: parsed.color,
      brightness: clamp(parsed.brightness, 0, 100),
      isDefault: false,
    };
  } catch {
    return defaultTheme;
  }
}

function applyTheme(preference: ThemePreference) {
  const root = document.documentElement.style;
  themeProperties.forEach((property) => root.removeProperty(property));

  if (preference.isDefault) {
    document.documentElement.removeAttribute("data-theme");
    return;
  }

  Object.entries(customThemeVariables(preference)).forEach(([property, value]) => {
    root.setProperty(property, value);
  });
  document.documentElement.dataset.theme = "custom";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreference] = useState<ThemePreference>(readStoredTheme);

  useEffect(() => {
    applyTheme(preference);
    try {
      if (preference.isDefault) window.localStorage.removeItem(THEME_STORAGE_KEY);
      else window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(preference));
    } catch {
      // The active session can still use themes when browser storage is unavailable.
    }
  }, [preference]);

  const value = useMemo<ThemeContextValue>(() => ({
    preference,
    setColor: (color) => {
      if (!hexToRgb(color)) return;
      setPreference((current) => ({ ...current, color, isDefault: false }));
    },
    setBrightness: (brightness) => {
      setPreference((current) => ({ ...current, brightness: clamp(brightness, 0, 100), isDefault: false }));
    },
    resetTheme: () => setPreference(defaultTheme),
  }), [preference]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
