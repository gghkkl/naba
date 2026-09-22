import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  PanResponder,
  Platform,
  Text,
  Dimensions,
} from "react-native";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";
import { usePathname, router } from "expo-router";
import { AppIcon } from "@/components/AppIcon";

const { width: SW } = Dimensions.get("window");

const TABS = [
  { name: "search", label: "البحث", icon: "search" as const },
  { name: "downloads", label: "التنزيلات", icon: "download" as const },
  { name: "library", label: "المكتبة", icon: "book-open" as const },
  { name: "index", label: "الرئيسية", icon: "home" as const },
];

const BAR_W = Math.min(SW * 0.9, 380);
const TAB_W = BAR_W / TABS.length;
const BAR_H = 64;
const BUBBLE_H = 48;
const ACTIVE_BUBBLE_OFFSET = Platform.OS === "android" ? 1 : 4;

function getActiveTab(pathname: string): string {
  if (pathname.includes("/downloads")) return "downloads";
  if (pathname.includes("/library")) return "library";
  if (pathname.includes("/search")) return "search";
  return "index";
}

export function GlassTabBar() {
  const insets = useSafeAreaInsets();
  const { mode, colors } = useTheme();
  const isDark = mode === "dark";
  const pathname = usePathname();
  const activeTab = getActiveTab(pathname);
  const activeIndex = TABS.findIndex((t) => t.name === activeTab);

  const [hoverIdx, setHoverIdx] = useState(activeIndex);
  const isDragging = useRef(false);
  const currentHoverIdx = useRef(activeIndex);
  const prevIdx = useRef(activeIndex);

  const animX = useRef(
    new Animated.Value(activeIndex * TAB_W + ACTIVE_BUBBLE_OFFSET),
  ).current;
  const animScale = useRef(new Animated.Value(1)).current;
  const animGlow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isDragging.current) {
      Animated.spring(animX, {
        toValue: activeIndex * TAB_W + ACTIVE_BUBBLE_OFFSET,
        useNativeDriver: true,
        tension: 130,
        friction: 20,
      }).start();
      prevIdx.current = activeIndex;
      setHoverIdx(activeIndex);
      currentHoverIdx.current = activeIndex;
    }
  }, [activeIndex]);

  const startDrag = useCallback(() => {
    isDragging.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    animX.extractOffset();
    Animated.parallel([
      Animated.spring(animScale, {
        toValue: 1.18,
        useNativeDriver: true,
        tension: 200,
        friction: 12,
      }),
      Animated.timing(animGlow, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => isDragging.current,
      onMoveShouldSetPanResponder: () => isDragging.current,
      onPanResponderMove: (_, g) => {
        const maxOffset = (TABS.length - 1 - prevIdx.current) * TAB_W;
        const minOffset = -prevIdx.current * TAB_W;
        const clamped = Math.max(minOffset, Math.min(maxOffset, g.dx));
        animX.setValue(clamped);
        const rawIdx = prevIdx.current + g.dx / TAB_W;
        const hIdx = Math.max(0, Math.min(TABS.length - 1, Math.round(rawIdx)));
        if (hIdx !== currentHoverIdx.current) {
          currentHoverIdx.current = hIdx;
          setHoverIdx(hIdx);
          Haptics.selectionAsync();
        }
      },
      onPanResponderRelease: () => {
        animX.flattenOffset();
        isDragging.current = false;
        Animated.parallel([
          Animated.spring(animScale, {
            toValue: 1,
            useNativeDriver: true,
            tension: 200,
            friction: 14,
          }),
          Animated.timing(animGlow, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
        const targetTab = TABS[currentHoverIdx.current].name;
        router.push(`/(tabs)/${targetTab === "index" ? "" : targetTab}` as any);
      },
    })
  ).current;

  const bubble = (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.bubble,
        {
          backgroundColor: colors.primarySoft,
          borderColor: colors.primary,
          shadowColor: colors.primary,
          transform: [{ translateX: animX }, { scale: animScale }],
          opacity: animGlow.interpolate({
            inputRange: [0, 1],
            outputRange: [0.85, 1],
          }),
        },
      ]}
    />
  );

  const tabItems = TABS.map((tab, idx) => {
    const isActive = tab.name === activeTab;
    const isHovered = isDragging.current && hoverIdx === idx;
    const tintColor =
      isActive || isHovered ? colors.primary : colors.mutedForeground;
    return (
      <TouchableOpacity
        key={tab.name}
        style={styles.tabItem}
        onPress={() => {
          if (!isDragging.current) {
            router.push(
              `/(tabs)/${tab.name === "index" ? "" : tab.name}` as any
            );
          }
        }}
        onLongPress={isActive ? startDrag : undefined}
        delayLongPress={380}
        activeOpacity={0.75}
      >
        <AppIcon name={tab.icon} size={22} color={tintColor} />
        <Text
          style={[
            styles.label,
            { color: tintColor, fontFamily: "Cairo_600SemiBold" },
          ]}
        >
          {tab.label}
        </Text>
      </TouchableOpacity>
    );
  });

  const bottom = Platform.OS === "web" ? 34 : Math.max(insets.bottom + 10, 12);

  return (
    <View
      style={[
        styles.container,
        Platform.OS === "android" && styles.androidContainer,
        { bottom },
      ]}
      {...panResponder.panHandlers}
    >
      {Platform.OS === "android" ? (
        <View
          style={[
            styles.blur,
            styles.androidBar,
            {
              backgroundColor: colors.card,
              borderColor: colors.glassBorder,
            },
          ]}
        >
          <BlurView
            intensity={50}
            tint={isDark ? "dark" : "default"}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <View
            pointerEvents="none"
            style={[styles.androidBg, { backgroundColor: colors.glass }]}
          />
          <View style={styles.androidIndicatorClip}>
            <Animated.View
              pointerEvents="none"
              style={[
                styles.bubble,
                styles.androidBubble,
                {
                  backgroundColor: colors.primarySoft,
                  borderColor: colors.primary,
                  shadowColor: colors.primary,
                },
                {
                  transform: [{ translateX: animX }, { scale: animScale }],
                  opacity: animGlow.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.9, 1],
                  }),
                },
              ]}
            />
          </View>
          {tabItems}
        </View>
      ) : (
        <BlurView
          intensity={Platform.OS === "ios" ? 85 : 50}
          tint={isDark ? "dark" : "default"}
          style={[styles.blur, { borderColor: colors.glassBorder }]}
        >
          {Platform.OS !== "ios" && (
            <View
              pointerEvents="none"
              style={[styles.androidBg, { backgroundColor: colors.glass }]}
            />
          )}
          {bubble}
          {tabItems}
        </BlurView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    alignSelf: "center",
    width: BAR_W,
    height: BAR_H,
    zIndex: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
  },
  blur: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BAR_H / 2,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  androidBg: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(10, 20, 16, 0.88)",
  },
  androidIndicatorClip: {
    ...StyleSheet.absoluteFill,
    borderRadius: 24,
    overflow: "hidden",
    pointerEvents: "none",
  },
  androidBar: {
    height: 72,
    borderRadius: 24,
    backgroundColor: "#10211C",
    borderColor: "rgba(232,224,204,0.16)",
    elevation: 12,
  },
  androidContainer: {
    height: 72,
  },
  bubble: {
    position: "absolute",
    left: 0,
    top: (BAR_H - BUBBLE_H) / 2,
    width: TAB_W - 8,
    height: BUBBLE_H,
    borderRadius: BUBBLE_H / 2,
    backgroundColor: "rgba(0, 90, 86, 0.28)",
    borderWidth: 1,
    borderColor: "rgba(0, 90, 86, 0.55)",
    shadowColor: "#005A56",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  androidBubble: {
    left: 0,
    top: 3,
    height: 66,
    width: TAB_W - 6,
    borderRadius: 20,
    backgroundColor: "rgba(0, 107, 101, 0.48)",
    borderColor: "rgba(91, 205, 190, 0.28)",
    shadowColor: "#2AC8B4",
    shadowOpacity: 0.18,
    shadowRadius: 5,
  },
  tabItem: {
    flex: 1,
    height: BAR_H,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  label: {
    fontSize: 10,
    textAlign: "center",
    letterSpacing: 0.2,
  },
});
