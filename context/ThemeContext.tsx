import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useColorScheme } from "react-native";
import colors, { ThemePalette } from "@/constants/colors";

export type ThemeMode = "dark" | "light";
type ThemePreference = ThemeMode | "system";

const THEME_STORAGE_KEY = "@al-habwa-al-tasea/theme-preference-v2";

type ThemeContextValue = {
  mode: ThemeMode;
  colors: ThemePalette;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreference] = useState<ThemePreference>("system");

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((storedMode) => {
        if (!active) return;
        if (
          storedMode === "system" ||
          storedMode === "light" ||
          storedMode === "dark"
        ) {
          setPreference(storedMode);
        }
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

  const mode: ThemeMode =
    preference === "system"
      ? systemScheme === "dark"
        ? "dark"
        : "light"
      : preference;

  const toggleTheme = useCallback(() => {
    setPreference((currentPreference) => {
      const currentMode =
        currentPreference === "system"
          ? systemScheme === "dark"
            ? "dark"
            : "light"
          : currentPreference;
      const nextMode: ThemeMode = currentMode === "dark" ? "light" : "dark";
      AsyncStorage.setItem(THEME_STORAGE_KEY, nextMode).catch(
        () => undefined,
      );
      return nextMode;
    });
  }, [systemScheme]);

  const value = useMemo(
    () => ({
      mode,
      colors: colors[mode],
      toggleTheme,
    }),
    [mode, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be within ThemeProvider");
  }
  return context;
}