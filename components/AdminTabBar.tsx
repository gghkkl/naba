import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router, usePathname } from "expo-router";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";

const tabs = [
  { path: "/admin/(tabs)", label: "المعاينة" },
  { path: "/admin/(tabs)/books", label: "الكتب" },
  { path: "/admin/(tabs)/ai", label: "المساعد" },
  { path: "/admin/(tabs)/settings", label: "الإعدادات" },
];

export function AdminTabBar() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  return (
    <View style={[styles.shell, { bottom: Math.max(insets.bottom + 10, 12) }]}>
      <BlurView intensity={65} tint="dark" style={[styles.bar, { borderColor: colors.glassBorder }]}>
        {tabs.map((tab) => {
          const active = pathname === tab.path || (tab.path !== "/admin/(tabs)" && pathname.includes(tab.path));
          return (
            <Pressable key={tab.path} style={styles.tab} onPress={() => router.replace(tab.path as never)}>
              <Text style={[styles.label, { color: active ? colors.primary : colors.mutedForeground }]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { position: "absolute", alignSelf: "center", width: "92%", zIndex: 20, shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 14, elevation: 10 },
  bar: { height: 62, borderRadius: 22, borderWidth: 1, backgroundColor: "rgba(12,26,21,0.9)", flexDirection: "row", alignItems: "center", overflow: "hidden" },
  tab: { flex: 1, alignItems: "center", justifyContent: "center", height: "100%" },
  label: { fontFamily: "Cairo_700Bold", fontSize: 11 },
});