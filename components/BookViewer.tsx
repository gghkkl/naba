import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { Asset } from "expo-asset";
import * as Haptics from "expo-haptics";
import { useBook } from "@/context/BookContext";
import { PAGE_IMAGES_WEBP as PAGE_IMAGES } from "@/assets/pageAssetsWebp";
import {
  HIGH_RES_FIRST_BOOK_PAGE,
  HIGH_RES_PAGE_IMAGES_WEBP as HIGH_RES_PAGE_IMAGES,
} from "@/assets/highResPageAssetsWebp";
import { useColors } from "@/hooks/useColors";

const TOTAL_PAGES = PAGE_IMAGES.length;
const PAGE_WIDTH = 804;
const PAGE_HEIGHT = 1134;
const PRELOAD_RADIUS = 2;

type Point = { x: number; y: number };
type GestureState = {
  mode: "idle" | "swipe" | "pan" | "pinch";
  startX: number;
  startY: number;
  startTime: number;
  startPan: Point;
  startZoom: number;
  startDistance: number;
  startCenter: Point;
};

function distanceBetween(first: { pageX: number; pageY: number }, second: { pageX: number; pageY: number }) {
  return Math.hypot(first.pageX - second.pageX, first.pageY - second.pageY);
}

export function BookViewer() {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const colors = useColors();
  const {
    currentPage,
    registerViewer,
    setCurrentPage,
    setTotalPages,
    setBookReady,
  } = useBook();

  const [page, setPage] = useState(
    Math.min(TOTAL_PAGES, Math.max(1, currentPage || 1)),
  );
  const [viewport, setViewport] = useState({
    width: windowWidth,
    height: windowHeight,
  });
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [loadedPage, setLoadedPage] = useState<number | null>(null);
  const zoomRef = useRef(1);
  const panRef = useRef<Point>({ x: 0, y: 0 });
  const scaleValue = useRef(new Animated.Value(1)).current;
  const translateXValue = useRef(new Animated.Value(0)).current;
  const translateYValue = useRef(new Animated.Value(0)).current;
  const gestureRef = useRef<GestureState>({
    mode: "idle",
    startX: 0,
    startY: 0,
    startTime: 0,
    startPan: { x: 0, y: 0 },
    startZoom: 1,
    startDistance: 0,
    startCenter: { x: 0, y: 0 },
  });
  const preloadGeneration = useRef(0);

  const pageWidth = Math.max(
    1,
    Math.min(
      viewport.width - 20,
      ((viewport.height - 24) * PAGE_WIDTH) / PAGE_HEIGHT,
    ),
  );
  const pageHeight = (pageWidth * PAGE_HEIGHT) / PAGE_WIDTH;
  const highResPageIndex = page - HIGH_RES_FIRST_BOOK_PAGE;
  const highResSource =
    highResPageIndex >= 0 && highResPageIndex < HIGH_RES_PAGE_IMAGES.length
      ? HIGH_RES_PAGE_IMAGES[highResPageIndex]
      : null;
  const pageSource =
    zoom >= 1.15 && highResSource ? highResSource : PAGE_IMAGES[page - 1];

  const resetTransform = useCallback(() => {
    zoomRef.current = 1;
    panRef.current = { x: 0, y: 0 };
    scaleValue.setValue(1);
    translateXValue.setValue(0);
    translateYValue.setValue(0);
    setZoom(1);
  }, [scaleValue, translateXValue, translateYValue]);

  const changePage = useCallback(
    (nextPage: number) => {
      const next = Math.min(TOTAL_PAGES, Math.max(1, Math.round(nextPage)));
      resetTransform();
      setImageError(null);
      setImageLoading(true);
      setLoadedPage(null);
      setPage(next);
      setCurrentPage(next);
    },
    [resetTransform, setCurrentPage],
  );

  const clampPan = useCallback(
    (nextPan: Point, nextZoom: number) => {
      const maxX = Math.max(0, ((pageWidth * nextZoom) - viewport.width) / 2 + 28);
      const maxY = Math.max(0, ((pageHeight * nextZoom) - viewport.height) / 2 + 28);
      return {
        x: Math.min(maxX, Math.max(-maxX, nextPan.x)),
        y: Math.min(maxY, Math.max(-maxY, nextPan.y)),
      };
    },
    [pageHeight, pageWidth, viewport.height, viewport.width],
  );

  const setZoomValue = useCallback(
    (nextZoom: number, nextPan = panRef.current) => {
      const boundedZoom = Math.min(4, Math.max(1, nextZoom));
      const boundedPan =
        boundedZoom <= 1.01
          ? { x: 0, y: 0 }
          : clampPan(nextPan, boundedZoom);
      zoomRef.current = boundedZoom;
      panRef.current = boundedPan;
      scaleValue.setValue(boundedZoom);
      translateXValue.setValue(boundedPan.x);
      translateYValue.setValue(boundedPan.y);
    },
    [clampPan, scaleValue, translateXValue, translateYValue],
  );

  const preloadWindow = useCallback((centerPage: number) => {
    const generation = preloadGeneration.current + 1;
    preloadGeneration.current = generation;
    const pagesToPreload = Array.from({ length: PRELOAD_RADIUS * 2 + 1 }, (_, index) => {
      return centerPage - PRELOAD_RADIUS + index;
    }).filter((candidate) => candidate >= 1 && candidate <= TOTAL_PAGES && candidate !== centerPage);

    pagesToPreload.forEach((candidate) => {
      const source = PAGE_IMAGES[candidate - 1];
      const asset = Asset.fromModule(source);
      const uri = asset.localUri ?? asset.uri;
      if (!uri || generation !== preloadGeneration.current) return;
      Image.prefetch(uri).catch(() => undefined);
    });
  }, []);

  useEffect(() => {
    setTotalPages(TOTAL_PAGES);
    setBookReady(true);
  }, [setBookReady, setTotalPages]);

  useEffect(() => {
    if (
      currentPage >= 1 &&
      currentPage <= TOTAL_PAGES &&
      currentPage !== page
    ) {
      changePage(currentPage);
    }
  }, [changePage, currentPage, page]);

  useEffect(() => {
    setImageLoading(true);
    setImageError(null);
    setLoadedPage(null);
  }, [page, retryKey]);

  useEffect(() => {
    if (loadedPage !== page) return;
    const timer = setTimeout(() => preloadWindow(page), 100);
    return () => clearTimeout(timer);
  }, [loadedPage, page, preloadWindow]);

  useEffect(() => {
    return registerViewer((message: object) => {
      const nextMessage = message as { type?: string; page?: number };
      if (
        (nextMessage.type === "goto" || nextMessage.type === "highlight") &&
        typeof nextMessage.page === "number"
      ) {
        changePage(nextMessage.page);
      }
    });
  }, [changePage, registerViewer]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          const touch = event.nativeEvent.touches[0];
          gestureRef.current = {
            mode: event.nativeEvent.touches.length >= 2
              ? "pinch"
              : zoomRef.current > 1.01
                ? "pan"
                : "swipe",
            startX: touch?.pageX ?? 0,
            startY: touch?.pageY ?? 0,
            startTime: Date.now(),
            startPan: panRef.current,
            startZoom: zoomRef.current,
            startDistance:
              event.nativeEvent.touches.length >= 2
                ? distanceBetween(event.nativeEvent.touches[0], event.nativeEvent.touches[1])
                : 0,
            startCenter:
              event.nativeEvent.touches.length >= 2
                ? {
                    x: (event.nativeEvent.touches[0].pageX + event.nativeEvent.touches[1].pageX) / 2,
                    y: (event.nativeEvent.touches[0].pageY + event.nativeEvent.touches[1].pageY) / 2,
                  }
                : { x: touch?.pageX ?? 0, y: touch?.pageY ?? 0 },
          };
        },
        onPanResponderMove: (event, gesture) => {
          const touches = event.nativeEvent.touches;
          if (touches.length >= 2) {
            const center = {
              x: (touches[0].pageX + touches[1].pageX) / 2,
              y: (touches[0].pageY + touches[1].pageY) / 2,
            };
            if (gestureRef.current.mode !== "pinch" || gestureRef.current.startDistance === 0) {
              gestureRef.current.mode = "pinch";
              gestureRef.current.startDistance = distanceBetween(touches[0], touches[1]);
              gestureRef.current.startZoom = zoomRef.current;
              gestureRef.current.startPan = panRef.current;
              gestureRef.current.startCenter = center;
            }
            const distance = distanceBetween(touches[0], touches[1]);
            if (gestureRef.current.startDistance > 0) {
              const nextZoom =
                (gestureRef.current.startZoom * distance) /
                gestureRef.current.startDistance;
              const scaleRatio = nextZoom / gestureRef.current.startZoom;
              const nextPan = {
                x:
                  center.x -
                  windowWidth / 2 -
                  scaleRatio *
                    (gestureRef.current.startCenter.x -
                      windowWidth / 2 -
                      gestureRef.current.startPan.x),
                y:
                  center.y -
                  windowHeight / 2 -
                  scaleRatio *
                    (gestureRef.current.startCenter.y -
                      windowHeight / 2 -
                      gestureRef.current.startPan.y),
              };
              setZoomValue(nextZoom, nextPan);
            }
            return;
          }

          if (zoomRef.current > 1.01) {
            gestureRef.current.mode = "pan";
            const nextPan = {
              x: gestureRef.current.startPan.x + gesture.dx,
              y: gestureRef.current.startPan.y + gesture.dy,
            };
            const boundedPan = clampPan(nextPan, zoomRef.current);
            panRef.current = boundedPan;
            translateXValue.setValue(boundedPan.x);
            translateYValue.setValue(boundedPan.y);
          }
        },
        onPanResponderRelease: (event) => {
          const gesture = gestureRef.current;
          const touch = event.nativeEvent.changedTouches[0];
          const dx = touch ? touch.pageX - gesture.startX : 0;
          const dy = touch ? touch.pageY - gesture.startY : 0;
          const elapsed = Date.now() - gesture.startTime;
          const wasPinching = gesture.mode === "pinch";
          gestureRef.current.mode = "idle";
          setZoom(zoomRef.current);
          if (
            !wasPinching &&
            zoomRef.current <= 1.08 &&
            Math.abs(dx) > Math.abs(dy) * 1.35 &&
            Math.abs(dx) > 44 &&
            elapsed < 650
          ) {
            const nextPage = page + (dx > 0 ? 1 : -1);
            if (nextPage < 1 || nextPage > TOTAL_PAGES) {
              void Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Warning,
              ).catch(() => undefined);
              return;
            }
            changePage(nextPage);
          }
        },
      }),
    [changePage, clampPan, page, setZoomValue, translateXValue, translateYValue],
  );

  return (
    <View
      style={[styles.root, { backgroundColor: colors.background }]}
      onLayout={(event) =>
        setViewport({
          width: event.nativeEvent.layout.width,
          height: event.nativeEvent.layout.height,
        })
      }
      {...panResponder.panHandlers}
    >
      {imageError ? (
        <View style={styles.errorBox}>
          <Text style={[styles.errorTitle, { color: colors.foreground }]}>
            تعذر عرض الصفحة
          </Text>
          <Text style={[styles.errorText, { color: colors.mutedForeground }]}>
            {imageError}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              setImageError(null);
              setImageLoading(true);
              setRetryKey((key) => key + 1);
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.retryText}>إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.pageViewport} pointerEvents="none">
          <Animated.Image
             key={`${page}-${highResSource && zoom >= 1.15 ? "high" : "standard"}-${retryKey}`}
             source={pageSource}
            resizeMode="contain"
            style={[
              styles.page,
              {
                width: pageWidth,
                height: pageHeight,
                left: (viewport.width - pageWidth) / 2,
                top: (viewport.height - pageHeight) / 2,
                transform: [
                  { translateX: translateXValue },
                  { translateY: translateYValue },
                  { scale: scaleValue },
                ],
              },
            ]}
            onLoad={() => {
              setImageLoading(false);
              setImageError(null);
              setLoadedPage(page);
            }}
            onError={() => {
              setImageLoading(false);
              setImageError("ملف الصفحة المحلي غير متاح");
            }}
            accessibilityLabel={`صفحة ${page}`}
          />
        </View>
      )}

      {imageLoading && !imageError ? (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator size="small" color={colors.secondary} />
          <Text style={[styles.loadingText, { color: colors.secondary }]}>
            جاري فتح الصفحة...
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: "#080E0C",
  },
  pageViewport: {
    ...StyleSheet.absoluteFill,
    overflow: "hidden",
  },
  page: {
    position: "absolute",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "rgba(8,14,12,0.2)",
  },
  loadingText: {
    color: "#B8A46A",
    fontSize: 13,
    fontFamily: "Cairo_400Regular",
  },
  errorBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 24,
  },
  errorTitle: {
    color: "#E8E0CC",
    fontSize: 17,
    fontFamily: "Cairo_700Bold",
  },
  errorText: {
    color: "#7A9590",
    fontSize: 13,
    fontFamily: "Cairo_400Regular",
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#005A56",
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  retryText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Cairo_700Bold",
  },
});