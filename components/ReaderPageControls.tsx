import React, { useMemo, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { AppIcon } from "@/components/AppIcon";
import { useColors } from "@/hooks/useColors";

type Props = {
  page: number;
  totalPages: number;
  bottomInset: number;
  onPageChange: (page: number) => void;
};

export function ReaderPageControls({
  page,
  totalPages,
  bottomInset,
  onPageChange,
}: Props) {
  const colors = useColors();
  const { width } = useWindowDimensions();
  const [inputOpen, setInputOpen] = useState(false);
  const [inputValue, setInputValue] = useState(String(page));
  const dragStartPage = useRef(page);
  const lastDragX = useRef(0);
  const lastDragAt = useRef(0);

  const goToPage = (nextPage: number) => {
    const bounded = Math.min(totalPages, Math.max(1, Math.round(nextPage)));
    if (bounded === page) return;
    onPageChange(bounded);
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dx) > 8 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
        onPanResponderGrant: (event) => {
          dragStartPage.current = page;
          lastDragX.current = event.nativeEvent.pageX;
          lastDragAt.current = Date.now();
        },
        onPanResponderMove: (event) => {
          const now = Date.now();
          const delta = event.nativeEvent.pageX - lastDragX.current;
          if (Math.abs(delta) < 22 || now - lastDragAt.current < 45) return;
          const steps = Math.max(1, Math.min(5, Math.round(Math.abs(delta) / 30)));
          lastDragX.current = event.nativeEvent.pageX;
          lastDragAt.current = now;
          goToPage(page + (delta > 0 ? steps : -steps));
        },
        onPanResponderRelease: () => {
          if (dragStartPage.current !== page) {
            void Haptics.selectionAsync().catch(() => undefined);
          }
        },
      }),
    [page, totalPages],
  );

  const submitPage = () => {
    const requested = Number.parseInt(inputValue.replace(/[^\d]/g, ""), 10);
    if (Number.isFinite(requested)) goToPage(requested);
    setInputOpen(false);
  };

  return (
    <>
      <View
        style={[
          styles.wrapper,
          {
            width: Math.min(width - 32, 340),
            bottom: Math.max(bottomInset + 12, 24),
          },
        ]}
        {...panResponder.panHandlers}
      >
        <BlurView intensity={36} tint="dark" style={styles.blur}>
          <View
            style={[
              styles.bar,
              { backgroundColor: colors.glass, borderColor: colors.glassBorder },
            ]}
          >
            <TouchableOpacity
              style={styles.arrow}
              onPress={() => {
                goToPage(page + 1);
                void Haptics.selectionAsync().catch(() => undefined);
              }}
              disabled={page >= totalPages}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="الصفحة التالية"
            >
              <AppIcon
                name="chevron-left"
                size={20}
                color={page >= totalPages ? colors.mutedForeground : colors.foreground}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.pageButton}
              onPress={() => {
                setInputValue(String(page));
                setInputOpen(true);
              }}
              activeOpacity={0.76}
              accessibilityRole="button"
              accessibilityLabel={`الصفحة ${page} من ${totalPages}. اضغط لإدخال رقم صفحة`}
            >
              <Text style={[styles.pageNumber, { color: colors.foreground }]}>
                {page}
              </Text>
              <Text style={[styles.pageTotal, { color: colors.mutedForeground }]}>
                / {totalPages}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.arrow}
              onPress={() => {
                goToPage(page - 1);
                void Haptics.selectionAsync().catch(() => undefined);
              }}
              disabled={page <= 1}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="الصفحة السابقة"
            >
              <AppIcon
                name="chevron-right"
                size={20}
                color={page <= 1 ? colors.mutedForeground : colors.foreground}
              />
            </TouchableOpacity>
          </View>
        </BlurView>
      </View>

      <Modal
        visible={inputOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setInputOpen(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalRoot}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setInputOpen(false)} />
          <View
            style={[
              styles.inputCard,
              { backgroundColor: colors.card, borderColor: colors.glassBorder },
            ]}
          >
            <Text style={[styles.inputTitle, { color: colors.foreground }]}>
              الانتقال إلى صفحة
            </Text>
            <TextInput
              value={inputValue}
              onChangeText={setInputValue}
              autoFocus
              keyboardType="number-pad"
              selectTextOnFocus
              returnKeyType="go"
              onSubmitEditing={submitPage}
              style={[
                styles.input,
                {
                  color: colors.foreground,
                  borderColor: colors.glassBorder,
                  backgroundColor: colors.background,
                },
              ]}
              accessibilityLabel="رقم الصفحة"
            />
            <View style={styles.inputActions}>
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: colors.glassBorder }]}
                onPress={() => setInputOpen(false)}
                activeOpacity={0.8}
              >
                <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>
                  إلغاء
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, { backgroundColor: colors.primary }]}
                onPress={submitPage}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmText}>انتقال</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    alignSelf: "center",
    borderRadius: 18,
    overflow: "hidden",
    zIndex: 20,
  },
  blur: {
    borderRadius: 18,
  },
  bar: {
    height: 58,
    borderWidth: 1,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 9,
  },
  arrow: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
  },
  pageButton: {
    minWidth: 120,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 5,
  },
  pageNumber: {
    fontFamily: "Cairo_700Bold",
    fontSize: 18,
  },
  pageTotal: {
    fontFamily: "Cairo_400Regular",
    fontSize: 12,
  },
  modalRoot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.58)",
  },
  inputCard: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 14,
  },
  inputTitle: {
    fontFamily: "Cairo_700Bold",
    fontSize: 17,
    textAlign: "right",
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    textAlign: "right",
    fontFamily: "Cairo_700Bold",
    fontSize: 18,
  },
  inputActions: {
    flexDirection: "row-reverse",
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 12,
  },
  cancelText: {
    fontFamily: "Cairo_600SemiBold",
    fontSize: 13,
  },
  confirmButton: {
    flex: 1,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  confirmText: {
    color: "#FFFFFF",
    fontFamily: "Cairo_700Bold",
    fontSize: 13,
  },
});