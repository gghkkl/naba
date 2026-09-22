import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

export const MIN_READING_FONT_SIZE = 11;
export const MAX_READING_FONT_SIZE = 20;
export const READING_FONT_SIZE_STEP = 1;

export function usePersistedFontSize(storageKey: string, defaultSize: number) {
  const [fontSize, setFontSize] = useState(defaultSize);

  useEffect(() => {
    let active = true;

    AsyncStorage.getItem(storageKey)
      .then((storedSize) => {
        if (!active || storedSize === null) return;
        const parsedSize = Number.parseInt(storedSize, 10);
        if (
          Number.isFinite(parsedSize) &&
          parsedSize >= MIN_READING_FONT_SIZE &&
          parsedSize <= MAX_READING_FONT_SIZE
        ) {
          setFontSize(parsedSize);
        }
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [storageKey]);

  const updateFontSize = useCallback(
    (nextSize: number) => {
      const boundedSize = Math.min(
        MAX_READING_FONT_SIZE,
        Math.max(MIN_READING_FONT_SIZE, nextSize),
      );
      setFontSize(boundedSize);
      AsyncStorage.setItem(storageKey, String(boundedSize)).catch(
        () => undefined,
      );
    },
    [storageKey],
  );

  const increaseFontSize = useCallback(() => {
    updateFontSize(fontSize + READING_FONT_SIZE_STEP);
  }, [fontSize, updateFontSize]);

  const decreaseFontSize = useCallback(() => {
    updateFontSize(fontSize - READING_FONT_SIZE_STEP);
  }, [fontSize, updateFontSize]);

  return {
    fontSize,
    increaseFontSize,
    decreaseFontSize,
    canIncrease: fontSize < MAX_READING_FONT_SIZE,
    canDecrease: fontSize > MIN_READING_FONT_SIZE,
  };
}