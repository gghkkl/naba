import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus, Platform } from "react-native";

type NetworkStatus = "checking" | "online" | "offline";

const NETWORK_PROBE_URL = "https://archive.org/";
const PROBE_TIMEOUT_MS = 4500;
const REFRESH_INTERVAL_MS = 15000;

export function useNetworkStatus() {
  const [status, setStatus] = useState<NetworkStatus>("checking");
  const [isRefreshing, setIsRefreshing] = useState(true);
  const mountedRef = useRef(true);
  const probePromiseRef = useRef<Promise<void> | null>(null);
  const probeControllerRef = useRef<AbortController | null>(null);
  const probeVersionRef = useRef(0);

  const checkNetwork = useCallback(async () => {
    if (probePromiseRef.current) return probePromiseRef.current;

    const version = probeVersionRef.current + 1;
    probeVersionRef.current = version;
    const probe = (async () => {
      if (mountedRef.current) setIsRefreshing(true);

      if (
        Platform.OS === "web" &&
        typeof navigator !== "undefined" &&
        navigator.onLine
      ) {
        if (mountedRef.current && probeVersionRef.current === version) {
          setStatus("online");
          setIsRefreshing(false);
        }
        return;
      }

      if (
        Platform.OS === "web" &&
        typeof navigator !== "undefined" &&
        !navigator.onLine
      ) {
        if (mountedRef.current && probeVersionRef.current === version) {
          setStatus("offline");
          setIsRefreshing(false);
        }
        return;
      }

      const controller = new AbortController();
      probeControllerRef.current = controller;
      const timeout = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);

      try {
        await fetch(NETWORK_PROBE_URL, {
          method: "HEAD",
          cache: "no-store",
          signal: controller.signal,
        });
        if (mountedRef.current && probeVersionRef.current === version) {
          setStatus("online");
        }
      } catch {
        if (mountedRef.current && probeVersionRef.current === version) {
          setStatus("offline");
        }
      } finally {
        clearTimeout(timeout);
        if (probeControllerRef.current === controller) {
          probeControllerRef.current = null;
        }
        if (mountedRef.current && probeVersionRef.current === version) {
          setIsRefreshing(false);
        }
      }
    })();

    probePromiseRef.current = probe;
    try {
      await probe;
    } finally {
      if (probePromiseRef.current === probe) {
        probePromiseRef.current = null;
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    void checkNetwork();

    const interval = setInterval(() => {
      void checkNetwork();
    }, REFRESH_INTERVAL_MS);

    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === "active") void checkNetwork();
    };
    const appStateSubscription = AppState.addEventListener("change", handleAppState);

    if (Platform.OS === "web" && typeof window !== "undefined") {
      const handleOnline = () => {
        void checkNetwork();
      };
      const handleOffline = () => {
        probeVersionRef.current += 1;
        probeControllerRef.current?.abort();
        probePromiseRef.current = null;
        if (mountedRef.current) {
          setStatus("offline");
          setIsRefreshing(false);
        }
      };
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      return () => {
        mountedRef.current = false;
        probeVersionRef.current += 1;
        probeControllerRef.current?.abort();
        clearInterval(interval);
        appStateSubscription.remove();
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }

    return () => {
      mountedRef.current = false;
      probeVersionRef.current += 1;
      probeControllerRef.current?.abort();
      clearInterval(interval);
      appStateSubscription.remove();
    };
  }, [checkNetwork]);

  return {
    status,
    isChecking: status === "checking",
    isRefreshing,
    isOnline: status === "online",
    isOffline: status === "offline",
    refresh: checkNetwork,
  };
}