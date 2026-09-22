import React, { useMemo, useRef, useState } from "react";
import {
  PanResponder,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Platform,
  Alert,
  Dimensions,
} from "react-native";
import { BlurView } from "expo-blur";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { BookViewer } from "@/components/BookViewer";
import { AppIcon } from "@/components/AppIcon";
import { useBook } from "@/context/BookContext";
import { useTheme } from "@/context/ThemeContext";
import { PAGE_IMAGES_WEBP as PAGE_IMAGES } from "@/assets/pageAssetsWebp";
import { SECOND_BOOK_FIRST_PAGE } from "@/constants/tableOfContents";

const GLASS_TAB_H = 80;
const PAGE_NAV_H = 54;
const { width: SW } = Dimensions.get("window");
const PAGE_DRAG_PIXELS = 34;
const DRAG_START_DISTANCE = 10;
const MAX_DISPATCH_INTERVAL = 85;

type PageDragState = {
  active: boolean;
  lastX: number;
  fractionalPage: number;
  targetPage: number;
  lastDispatchedPage: number;
  lastDispatchAt: number;
};

export default function BookScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 0 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const { mode, colors } = useTheme();

  const {
    currentPage,
    totalPages,
    fromSearch,
    fromContents,
    setFromSearch,
    setFromContents,
    searchResults,
    searchResultIndex,
    setSearchResultIndex,
    jumpToPage,
  } = useBook();

  const [jumpVisible, setJumpVisible] = useState(false);
  const [jumpInput, setJumpInput] = useState("");
  const [isPageBarDragging, setIsPageBarDragging] = useState(false);
  const currentPageRef = useRef(currentPage);
  const dragRef = useRef<PageDragState>({
    active: false,
    lastX: 0,
    fractionalPage: currentPage,
    targetPage: currentPage,
    lastDispatchedPage: currentPage,
    lastDispatchAt: 0,
  });
  currentPageRef.current = currentPage;

  const openJump = () => {
    setJumpInput(String(currentPage));
    setJumpVisible(true);
  };

  const confirmJump = () => {
    const n = parseInt(jumpInput, 10);
    if (!n || n < 1 || n > totalPages) {
      Alert.alert("رقم غير صحيح", `أدخل رقمًا بين 1 و${totalPages}`);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    jumpToPage(n);
    setJumpVisible(false);
  };

  const goBack = () => {
    if (fromSearch) {
      setFromSearch(false);
      router.push("/(tabs)/search");
    } else if (fromContents) {
      setFromContents(false);
      router.push("/(tabs)/contents");
    }
  };

  const moveSearchResult = (direction: -1 | 1) => {
    const nextIndex = searchResultIndex + direction;
    const nextResult = searchResults[nextIndex];
    if (!nextResult) return;
    setSearchResultIndex(nextIndex);
    jumpToPage(nextResult.page);
  };

  const toggleBookStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    jumpToPage(
      currentPage >= SECOND_BOOK_FIRST_PAGE ? 1 : SECOND_BOOK_FIRST_PAGE,
    );
  };

  const dispatchDraggedPage = (nextPage: number, force = false) => {
    const maximumPage = totalPages > 0 ? totalPages : PAGE_IMAGES.length;
    const boundedPage = Math.min(maximumPage, Math.max(1, Math.round(nextPage)));
    const now = Date.now();
    const drag = dragRef.current;
    drag.targetPage = boundedPage;
    if (
      !force &&
      (now - drag.lastDispatchAt < MAX_DISPATCH_INTERVAL ||
        boundedPage === drag.lastDispatchedPage)
    ) {
      return;
    }
    if (boundedPage === drag.lastDispatchedPage) return;
    drag.lastDispatchedPage = boundedPage;
    drag.lastDispatchAt = now;
    jumpToPage(boundedPage);
  };

  const pageBarPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dx) > DRAG_START_DISTANCE &&
          Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.2,
        onMoveShouldSetPanResponderCapture: (_, gesture) =>
          Math.abs(gesture.dx) > DRAG_START_DISTANCE &&
          Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.2,
        onPanResponderGrant: (_, gesture) => {
          const page = currentPageRef.current;
          dragRef.current = {
            active: true,
            lastX: gesture.moveX,
            fractionalPage: page,
            targetPage: page,
            lastDispatchedPage: page,
            lastDispatchAt: Date.now(),
          };
          setIsPageBarDragging(true);
        },
        onPanResponderMove: (_, gesture) => {
          const drag = dragRef.current;
          if (!drag.active) return;

          const deltaX = gesture.moveX - drag.lastX;
          drag.lastX = gesture.moveX;
          const speedMultiplier = Math.min(
            3.2,
            1 + Math.abs(gesture.vx) * 0.75,
          );

          // Keep the same direction as the book: dragging right advances,
          // while dragging left goes back toward earlier pages.
          drag.fractionalPage +=
            (deltaX / PAGE_DRAG_PIXELS) * speedMultiplier;
          const maximumPage = totalPages > 0 ? totalPages : PAGE_IMAGES.length;
          drag.fractionalPage = Math.min(
            maximumPage,
            Math.max(1, drag.fractionalPage),
          );
          dispatchDraggedPage(drag.fractionalPage);
        },
        onPanResponderRelease: () => {
          const drag = dragRef.current;
          if (!drag.active) return;
          dispatchDraggedPage(drag.targetPage, true);
          drag.active = false;
          setIsPageBarDragging(false);
        },
        onPanResponderTerminate: () => {
          const drag = dragRef.current;
          if (!drag.active) return;
          dispatchDraggedPage(drag.targetPage, true);
          drag.active = false;
          setIsPageBarDragging(false);
        },
        onPanResponderTerminationRequest: () => false,
      }),
    [jumpToPage, totalPages],
  );

  const pageNavControls = (
    <>
      {/* Next page — left side for the RTL reading direction */}
      <TouchableOpacity
        style={styles.navBtn}
        onPress={() => currentPage < totalPages && jumpToPage(currentPage + 1)}
        activeOpacity={0.7}
        disabled={currentPage >= totalPages}
        accessibilityLabel="الصفحة التالية"
      >
        <AppIcon
          name="chevron-left"
          size={22}
            color={currentPage < totalPages ? colors.foreground : colors.mutedForeground}
        />
      </TouchableOpacity>

      {/* Page counter — tap to jump */}
      <TouchableOpacity
        style={styles.pageCounter}
        onPress={openJump}
        activeOpacity={0.8}
      >
        {totalPages > 0 ? (
          <Text style={[styles.pageCountText, { color: colors.foreground }]}>
            <Text style={[styles.pageNum, { color: colors.secondary }]}>{currentPage}</Text>
            <Text style={[styles.pageSep, { color: colors.secondarySoft }]}> / </Text>
            <Text style={[styles.pageTotal, { color: colors.mutedForeground }]}>{totalPages}</Text>
          </Text>
        ) : (
          <Text style={styles.pageCountText}>—</Text>
        )}
      </TouchableOpacity>

      {/* Quiet shortcut between the two continuous book sections. */}
      <TouchableOpacity
        style={[
          styles.bookToggle,
          {
            borderColor: colors.secondarySoft,
            backgroundColor: colors.secondarySoft,
          },
        ]}
        onPress={toggleBookStart}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityLabel={
          currentPage >= SECOND_BOOK_FIRST_PAGE
            ? "الانتقال إلى الجزء الأول"
            : "الانتقال إلى الجزء الثاني"
        }
        testID="book-start-toggle"
      >
        <AppIcon name="repeat" size={15} color={colors.secondary} />
        <Text style={[styles.bookToggleText, { color: colors.foreground }]}>
          {currentPage >= SECOND_BOOK_FIRST_PAGE ? "ج1" : "ج2"}
        </Text>
      </TouchableOpacity>

      {/* Previous page — right side for the RTL reading direction */}
      <TouchableOpacity
        style={styles.navBtn}
        onPress={() => currentPage > 1 && jumpToPage(currentPage - 1)}
        activeOpacity={0.7}
        disabled={currentPage <= 1}
        accessibilityLabel="الصفحة السابقة"
      >
        <AppIcon
          name="chevron-right"
          size={22}
            color={currentPage > 1 ? colors.foreground : colors.mutedForeground}
        />
      </TouchableOpacity>
    </>
  );

  // Total bottom reserved space = page nav + glass tab bar + bottom inset
  const bottomReserved = PAGE_NAV_H + GLASS_TAB_H + bottomPad;

  return (
    <View style={[styles.root, { paddingTop: topPad, backgroundColor: colors.background }]}>
      {/* Book viewer fills the remaining space above the nav bar */}
      <View style={[styles.viewerWrap, { paddingBottom: bottomReserved }]}>
        <BookViewer />
      </View>

      {/* Page navigation bar — sits just above the glass tab bar */}
      <View
          style={[
            styles.pageNav,
            { borderColor: colors.glassBorder },
          isPageBarDragging && styles.pageNavDragging,
          { bottom: GLASS_TAB_H + bottomPad + 10 },
        ]}
        {...pageBarPanResponder.panHandlers}
      >
        {Platform.OS === "android" ? (
          <>
            <BlurView
              intensity={75}
              tint={mode === "dark" ? "dark" : "light"}
              style={styles.pageNavAndroidBlur}
              pointerEvents="none"
            />
            <View
              pointerEvents="none"
              style={[styles.pageNavAndroidTint, { backgroundColor: colors.glass }]}
            />
            <View style={styles.pageNavBlur}>{pageNavControls}</View>
          </>
        ) : (
          <BlurView
            intensity={75}
            tint={mode === "dark" ? "dark" : "light"}
            style={styles.pageNavBlur}
          >
            {pageNavControls}
          </BlurView>
        )}
      </View>

      {/* Context navigation stays visible while reading from search or contents. */}
      {(fromSearch || fromContents) && (
        <View style={[styles.contextActions, { top: topPad + 12 }]}>
          <TouchableOpacity
            style={[styles.backBtn, { borderColor: colors.glassBorder }]}
            onPress={goBack}
            activeOpacity={0.8}
          >
            <BlurView
              intensity={80}
              tint={mode === "dark" ? "dark" : "light"}
              style={styles.backBtnBlur}
              pointerEvents={Platform.OS === "android" ? "none" : "auto"}
            >
                <AppIcon name="arrow-left" size={15} color={colors.foreground} />
              <Text style={[styles.backBtnText, { color: colors.foreground }]}>
                {fromSearch ? "البحث" : "الفهرس"}
              </Text>
            </BlurView>
          </TouchableOpacity>

          {fromSearch && (
            <View style={styles.resultNavRow}>
              <TouchableOpacity
                style={[
                  styles.resultArrow,
                  { borderColor: colors.glassBorder },
                  searchResultIndex >= searchResults.length - 1 &&
                    styles.resultArrowDisabled,
                ]}
                onPress={() => moveSearchResult(1)}
                disabled={searchResultIndex >= searchResults.length - 1}
                activeOpacity={0.8}
                accessibilityLabel="النتيجة التالية"
              >
                <BlurView
                  intensity={80}
                  tint={mode === "dark" ? "dark" : "light"}
                  style={styles.resultArrowBlur}
                  pointerEvents={Platform.OS === "android" ? "none" : "auto"}
                >
                  <AppIcon
                    name="arrow-left"
                    size={16}
                    color={
                      searchResultIndex < searchResults.length - 1
                        ? colors.foreground
                        : colors.mutedForeground
                    }
                  />
                </BlurView>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.resultArrow,
                  { borderColor: colors.glassBorder },
                  searchResultIndex <= 0 && styles.resultArrowDisabled,
                ]}
                onPress={() => moveSearchResult(-1)}
                disabled={searchResultIndex <= 0}
                activeOpacity={0.8}
                accessibilityLabel="النتيجة السابقة"
              >
                <BlurView
                  intensity={80}
                  tint={mode === "dark" ? "dark" : "light"}
                  style={styles.resultArrowBlur}
                  pointerEvents={Platform.OS === "android" ? "none" : "auto"}
                >
                  <AppIcon
                    name="arrow-right"
                    size={16}
                    color={
                      searchResultIndex > 0
                        ? colors.foreground
                        : colors.mutedForeground
                    }
                  />
                </BlurView>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Jump to page modal */}
      <Modal
        visible={jumpVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setJumpVisible(false)}
      >
        <View style={[styles.overlay, { backgroundColor: colors.scrim }]}>
          <KeyboardAvoidingView
            style={styles.keyboardAvoider}
            behavior="padding"
            keyboardVerticalOffset={0}
          >
            <BlurView
              intensity={90}
              tint={mode === "dark" ? "dark" : "light"}
              style={[styles.modal, { backgroundColor: colors.card }]}
            >
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>انتقل إلى صفحة</Text>
              <TextInput
                style={[
                  styles.modalInput,
                  {
                    backgroundColor: colors.input,
                    borderColor: colors.primary,
                    color: colors.foreground,
                  },
                ]}
                value={jumpInput}
                onChangeText={setJumpInput}
                keyboardType="number-pad"
                placeholder={`1 — ${totalPages}`}
                placeholderTextColor={colors.mutedForeground}
                textAlign="center"
                autoFocus
                returnKeyType="go"
                onSubmitEditing={confirmJump}
                selectionColor={colors.primary}
              />
              <View style={styles.modalRow}>
                <TouchableOpacity
                  style={[styles.cancelBtn, { borderColor: colors.glassBorder }]}
                  onPress={() => setJumpVisible(false)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>إلغاء</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
                  onPress={confirmJump}
                  activeOpacity={0.8}
                >
                  <Text style={styles.confirmText}>انتقل</Text>
                </TouchableOpacity>
              </View>
            </BlurView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#080E0C",
  },
  viewerWrap: {
    flex: 1,
  },
  pageNav: {
    position: "absolute",
    alignSelf: "center",
    width: Math.min(SW * 0.78, 320),
    height: PAGE_NAV_H,
    borderRadius: PAGE_NAV_H / 2,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  pageNavDragging: {
    borderColor: "rgba(184,164,106,0.65)",
  },
  pageNavBlur: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  pageNavAndroidBlur: {
    ...StyleSheet.absoluteFill,
  },
  pageNavAndroidTint: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(8, 18, 15, 0.46)",
  },
  navBtn: {
    width: 48,
    height: PAGE_NAV_H,
    alignItems: "center",
    justifyContent: "center",
  },
  pageCounter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  bookToggle: {
    width: 48,
    height: 38,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    gap: 1,
    borderWidth: 1,
    borderColor: "rgba(184,164,106,0.24)",
    backgroundColor: "rgba(184,164,106,0.06)",
  },
  bookToggleText: {
    color: "rgba(232,224,204,0.72)",
    fontSize: 11,
    lineHeight: 13,
    fontFamily: "Cairo_700Bold",
    writingDirection: "ltr",
  },
  pageCountText: {
    textAlign: "center",
  },
  pageNum: {
    color: "#B8A46A",
    fontSize: 18,
    fontFamily: "Cairo_700Bold",
  },
  pageSep: {
    color: "rgba(184,164,106,0.4)",
    fontSize: 14,
    fontFamily: "Cairo_400Regular",
  },
  pageTotal: {
    color: "rgba(232,224,204,0.45)",
    fontSize: 14,
    fontFamily: "Cairo_400Regular",
  },
  backBtn: {
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    zIndex: 10,
  },
  contextActions: {
    position: "absolute",
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    zIndex: 10,
  },
  backBtnBlur: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 11,
    paddingVertical: 7,
    gap: 5,
  },
  backBtnText: {
    color: "#E8E0CC",
    fontSize: 12,
    fontFamily: "Cairo_600SemiBold",
  },
  resultNavRow: {
    flexDirection: "row",
    gap: 5,
  },
  resultArrow: {
    width: 34,
    height: 34,
    borderRadius: 11,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  resultArrowDisabled: {
    opacity: 0.55,
  },
  resultArrowBlur: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
  },
  keyboardAvoider: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  modal: {
    width: 280,
    borderRadius: 20,
    overflow: "hidden",
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    gap: 18,
  },
  modalTitle: {
    color: "#E8E0CC",
    fontSize: 17,
    fontFamily: "Cairo_700Bold",
    textAlign: "center",
  },
  modalInput: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    color: "#E8E0CC",
    fontSize: 24,
    fontFamily: "Cairo_700Bold",
    borderWidth: 1,
    borderColor: "rgba(0,90,86,0.5)",
    textAlign: "center",
  },
  modalRow: {
    flexDirection: "row",
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
  },
  cancelText: {
    color: "#7A9590",
    fontSize: 15,
    fontFamily: "Cairo_600SemiBold",
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: "#005A56",
    alignItems: "center",
  },
  confirmText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: "Cairo_700Bold",
  },
});
