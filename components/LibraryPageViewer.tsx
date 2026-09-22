import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  ImageSourcePropType,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import * as Haptics from "expo-haptics";
import { LibraryBook } from "@/data/library";
import { useLibrary } from "@/context/LibraryContext";
import { useColors } from "@/hooks/useColors";

const PAGE_WIDTH = 416.64;
const PAGE_HEIGHT = 606.48;
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

type Props = {
  book: LibraryBook;
  page: number;
  bottomInset: number;
  onPageChange: (page: number) => void;
};

function distanceBetween(
  first: { pageX: number; pageY: number },
  second: { pageX: number; pageY: number },
) {
  return Math.hypot(first.pageX - second.pageX, first.pageY - second.pageY);
}

export function LibraryPageViewer({
  book,
  page,
  bottomInset,
  onPageChange,
}: Props) {
  const colors = useColors();
  const { width, height } = useWindowDimensions();
  const { downloads, setProgress } = useLibrary();
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const pageRef = useRef(page);
  const preloadGeneration = useRef(0);
  const prefetchedUris = useRef(new Set<string>());
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

  pageRef.current = page;

  const availableHeight = Math.max(1, height - bottomInset);
  const pageWidth = Math.max(
    1,
    Math.min(width - 24, ((availableHeight - 34) * PAGE_WIDTH) / PAGE_HEIGHT),
  );
  const pageHeight = (pageWidth * PAGE_HEIGHT) / PAGE_WIDTH;
  const pageTop = Math.max(0, (availableHeight - pageHeight) / 2);

  const sourceFor = useCallback(
    (pageNumber: number): ImageSourcePropType => {
      if (
        downloads[book.id]?.status === "downloaded" &&
        downloads[book.id]?.localPageDirectory
      ) {
        return {
          uri: `${downloads[book.id]?.localPageDirectory}${pageNumber - 1}.jpg`,
        };
      }
      if (book.pageAssets?.[pageNumber - 1]) {
        return book.pageAssets[pageNumber - 1];
      }
      return {
        uri: book.pageUrlTemplate.replace("{page}", String(pageNumber - 1)),
      };
    },
    [book.id, book.pageAssets, book.pageUrlTemplate, downloads],
  );

  const pageSource = useMemo(() => sourceFor(page), [page, sourceFor]);

  const clampPan = useCallback(
    (nextPan: Point, nextZoom: number) => {
      const maxX = Math.max(0, ((pageWidth * nextZoom) - width) / 2 + 28);
      const maxY = Math.max(
        0,
        ((pageHeight * nextZoom) - availableHeight) / 2 + 28,
      );
      return {
        x: Math.min(maxX, Math.max(-maxX, nextPan.x)),
        y: Math.min(maxY, Math.max(-maxY, nextPan.y)),
      };
    },
    [availableHeight, pageHeight, pageWidth, width],
  );

  const setTransform = useCallback(
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

  const resetTransform = useCallback(() => {
    setTransform(1, { x: 0, y: 0 });
  }, [setTransform]);

  const changePage = useCallback(
    (nextPage: number) => {
      if (nextPage < 1 || nextPage > book.pageCount) {
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Warning,
        ).catch(() => undefined);
        return;
      }
      resetTransform();
      setLoading(true);
      setFailed(false);
      onPageChange(nextPage);
    },
    [book.pageCount, onPageChange, resetTransform],
  );

  useEffect(() => {
    setLoading(true);
    setFailed(false);
    setProgress(book.id, page);

    const generation = preloadGeneration.current + 1;
    preloadGeneration.current = generation;
    const nearby = Array.from(
      { length: PRELOAD_RADIUS * 2 + 1 },
      (_, index) => page - PRELOAD_RADIUS + index,
    ).filter(
      (candidate) =>
        candidate >= 1 && candidate <= book.pageCount && candidate !== page,
    );

    nearby.forEach((candidate) => {
      const source = sourceFor(candidate);
      if (
        typeof source !== "object" ||
        !("uri" in source) ||
        typeof source.uri !== "string"
      ) {
        return;
      }
      const uri = source.uri;
      if (prefetchedUris.current.has(uri)) return;
      prefetchedUris.current.add(uri);
      if (generation === preloadGeneration.current) {
        Image.prefetch(uri).catch(() => {
          prefetchedUris.current.delete(uri);
        });
      }
    });
  }, [book.id, book.pageCount, page, setProgress, sourceFor]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          const touch = event.nativeEvent.touches[0];
          const touches = event.nativeEvent.touches;
          gestureRef.current = {
            mode: touches.length >= 2 ? "pinch" : zoomRef.current > 1.01 ? "pan" : "swipe",
            startX: touch?.pageX ?? 0,
            startY: touch?.pageY ?? 0,
            startTime: Date.now(),
            startPan: panRef.current,
            startZoom: zoomRef.current,
            startDistance:
              touches.length >= 2
                ? distanceBetween(touches[0], touches[1])
                : 0,
            startCenter:
              touches.length >= 2
                ? {
                    x: (touches[0].pageX + touches[1].pageX) / 2,
                    y: (touches[0].pageY + touches[1].pageY) / 2,
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
            if (
              gestureRef.current.mode !== "pinch" ||
              gestureRef.current.startDistance === 0
            ) {
              gestureRef.current.mode = "pinch";
              gestureRef.current.startDistance = distanceBetween(
                touches[0],
                touches[1],
              );
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
                  width / 2 -
                  scaleRatio *
                    (gestureRef.current.startCenter.x -
                      width / 2 -
                      gestureRef.current.startPan.x),
                y:
                  center.y -
                  availableHeight / 2 -
                  scaleRatio *
                    (gestureRef.current.startCenter.y -
                      availableHeight / 2 -
                      gestureRef.current.startPan.y),
              };
              setTransform(nextZoom, nextPan);
            }
            return;
          }

          if (zoomRef.current > 1.01) {
            gestureRef.current.mode = "pan";
            setTransform(zoomRef.current, {
              x: gestureRef.current.startPan.x + gesture.dx,
              y: gestureRef.current.startPan.y + gesture.dy,
            });
          }
        },
        onPanResponderRelease: (event) => {
          const gestureState = gestureRef.current;
          const touch = event.nativeEvent.changedTouches[0];
          const dx = touch ? touch.pageX - gestureState.startX : 0;
          const dy = touch ? touch.pageY - gestureState.startY : 0;
          const elapsed = Date.now() - gestureState.startTime;
          const wasPinching = gestureState.mode === "pinch";
          gestureRef.current.mode = "idle";

          if (
            !wasPinching &&
            zoomRef.current <= 1.08 &&
            Math.abs(dx) > Math.abs(dy) * 1.35 &&
            Math.abs(dx) > 44 &&
            elapsed < 650
          ) {
            changePage(pageRef.current + (dx > 0 ? 1 : -1));
          }
        },
      }),
    [availableHeight, changePage, setTransform, width],
  );

  return (
    <View
      style={[styles.root, { backgroundColor: colors.background }]}
      {...panResponder.panHandlers}
    >
      <View pointerEvents="none" style={styles.pageViewport}>
        {failed ? null : (
          <Animated.Image
            key={`${page}-${retryKey}`}
            source={pageSource}
            resizeMode="contain"
            style={[
              styles.page,
              {
                width: pageWidth,
                height: pageHeight,
                left: (width - pageWidth) / 2,
                top: pageTop,
                transform: [
                  { translateX: translateXValue },
                  { translateY: translateYValue },
                  { scale: scaleValue },
                ],
              },
            ]}
            onLoad={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setFailed(true);
            }}
            accessibilityLabel={`صفحة ${page} من ${book.title}`}
          />
        )}
      </View>

      {failed ? (
        <View style={styles.message}>
          <Text style={[styles.messageTitle, { color: colors.foreground }]}>
            تعذر فتح الصفحة
          </Text>
          <Text style={[styles.messageText, { color: colors.mutedForeground }]}>
            تحقق من الاتصال أو من تنزيل الكتاب ثم حاول مرة أخرى.
          </Text>
          <TouchableOpacity
            style={[styles.retry, { backgroundColor: colors.primary }]}
            onPress={() => {
              setLoading(true);
              setFailed(false);
              setRetryKey((key) => key + 1);
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.retryText}>إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {loading && !failed ? (
        <View style={styles.loading} pointerEvents="none">
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
  },
  pageViewport: {
    ...StyleSheet.absoluteFill,
    overflow: "hidden",
  },
  page: {
    position: "absolute",
  },
  loading: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  loadingText: {
    fontFamily: "Cairo_400Regular",
    fontSize: 12,
  },
  message: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 28,
  },
  messageTitle: {
    fontFamily: "Cairo_700Bold",
    fontSize: 18,
  },
  messageText: {
    fontFamily: "Cairo_400Regular",
    fontSize: 13,
    textAlign: "center",
  },
  retry: {
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  retryText: {
    color: "#FFFFFF",
    fontFamily: "Cairo_700Bold",
    fontSize: 13,
  },
});