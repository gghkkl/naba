import React from "react";
import { StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useColors } from "@/hooks/useColors";

type BottomListFadeProps = {
  bottom: number;
  height?: number;
};

export function BottomListFade({
  bottom = 0,
  height = 132,
}: BottomListFadeProps) {
  const colors = useColors();

  return (
    <LinearGradient
      pointerEvents="none"
      colors={[
        "transparent",
        colors.overlay,
        colors.glass,
        colors.background,
      ]}
      locations={[0, 0.52, 0.82, 1]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={[styles.fade, { bottom, height }]}
    />
  );
}

const styles = StyleSheet.create({
  fade: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 5,
  },
});