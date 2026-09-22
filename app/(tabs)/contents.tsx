import React, { useMemo, useRef, useState } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useBook } from "@/context/BookContext";
import {
  SECOND_BOOK_TABLE_OF_CONTENTS,
  TABLE_OF_CONTENTS,
  TocEntry,
} from "@/constants/tableOfContents";
import { normalizeForSearch } from "@/utils/searchNormalization";
import { usePersistedFontSize } from "@/hooks/usePersistedFontSize";
import { AppIcon } from "@/components/AppIcon";
import { BottomListFade } from "@/components/BottomListFade";
import { useColors } from "@/hooks/useColors";

const CONTENTS_FONT_SIZE_KEY = "@al-habwa-al-tasea/contents-font-size";
const DEFAULT_CONTENTS_FONT_SIZE = 15;

type TocListItem =
  {
    entry: TocEntry;
    normalizedTitle: string;
    number: number;
    book: "first" | "second";
  };

export default function ContentsScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const tabBarHeight = Platform.OS === "android" ? 72 : 64;
  const tabBarBottom =
    Platform.OS === "web" ? 34 : Math.max(insets.bottom + 10, 12);
  const listBottomPad = tabBarHeight + tabBarBottom + 16;
  const colors = useColors();
  const { jumpToPage, setFromSearch, setFromContents } = useBook();
  const {
    fontSize,
    increaseFontSize,
    decreaseFontSize,
    canIncrease,
    canDecrease,
  } = usePersistedFontSize(
    CONTENTS_FONT_SIZE_KEY,
    DEFAULT_CONTENTS_FONT_SIZE,
  );
  const [query, setQuery] = useState("");
  const [activePart, setActivePart] = useState<"first" | "second">("first");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const listRef = useRef<FlatList<TocListItem>>(null);

  const contentsByPart = useMemo<Record<"first" | "second", TocListItem[]>>(
    () => ({
      first: TABLE_OF_CONTENTS.map((entry, index) => ({
        entry,
        normalizedTitle: normalizeForSearch(entry.title),
        number: index + 1,
        book: "first" as const,
      })),
      second: SECOND_BOOK_TABLE_OF_CONTENTS.map((entry, index) => ({
        entry,
        normalizedTitle: normalizeForSearch(entry.title),
        number: index + 1,
        book: "second" as const,
      })),
    }),
    [],
  );

  const normalizedQuery = normalizeForSearch(query);
  const filteredContents = useMemo<TocListItem[]>(() => {
    const activeContents = contentsByPart[activePart];
    const normalizedQuery = normalizeForSearch(query);
    if (!normalizedQuery) return activeContents;
    return activeContents.filter((item) =>
      item.normalizedTitle.includes(normalizedQuery),
    );
  }, [activePart, contentsByPart, query]);

  React.useEffect(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
    setShowScrollTop(false);
  }, [activePart]);

  const targetPart = activePart === "first" ? "second" : "first";
  const targetPartContents = contentsByPart[targetPart].filter((item) =>
    !normalizedQuery
      ? true
      : item.normalizedTitle.includes(normalizedQuery),
  );
  const canTogglePart = targetPartContents.length > 0;

  const handlePartToggle = () => {
    if (!canTogglePart) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActivePart(targetPart);
  };

  const handleTocPress = (entry: TocEntry) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFromSearch(false);
    setFromContents(true);
    jumpToPage(entry.page);
    router.push("/(tabs)/book");
  };

  const renderItem = ({ item }: { item: TocListItem }) => {
    return (
      <TouchableOpacity
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.borderStrong },
        ]}
        onPress={() => handleTocPress(item.entry)}
        activeOpacity={0.75}
      >
          <View style={styles.cardInner}>
            <View style={styles.cardMeta}>
              <View style={[styles.cardNumber, { backgroundColor: colors.primarySoft }]}>
                <Text style={[styles.cardNumberText, { color: colors.primary }]}>
                  {item.number}
                </Text>
              </View>
              <View style={[styles.cardPartBadge, { backgroundColor: colors.primarySoft }]}>
                <Text style={[styles.cardPartText, { color: colors.primary }]}>
                  {item.book === "first" ? "ج1" : "ج2"}
                </Text>
              </View>
            </View>
          <Text
            style={[
              styles.cardTitle,
              { color: colors.cardForeground },
              {
                fontSize,
                lineHeight: Math.round(fontSize * 1.6),
              },
            ]}
            numberOfLines={2}
          >
            {item.entry.title}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <View style={styles.titleRow}>
          <View style={styles.fontControls}>
            <TouchableOpacity
              style={styles.fontButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                decreaseFontSize();
              }}
              disabled={!canDecrease}
              activeOpacity={0.7}
              accessibilityLabel="تصغير خط الفهرس"
              accessibilityState={{ disabled: !canDecrease }}
              testID="contents-font-decrease"
            >
              <AppIcon
                name="minus"
                size={19}
                color={canDecrease ? colors.secondary : colors.mutedForeground}
              />
            </TouchableOpacity>
            <Text style={[styles.fontSizeValue, { color: colors.mutedForeground }]}>{fontSize}</Text>
            <TouchableOpacity
              style={styles.fontButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                increaseFontSize();
              }}
              disabled={!canIncrease}
              activeOpacity={0.7}
              accessibilityLabel="تكبير خط الفهرس"
              accessibilityState={{ disabled: !canIncrease }}
              testID="contents-font-increase"
            >
              <AppIcon
                name="plus"
                size={19}
                color={canIncrease ? colors.secondary : colors.mutedForeground}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.titleGroup}>
            <TouchableOpacity
              style={[
                styles.partToggle,
                {
                  borderColor: colors.secondarySoft,
                  backgroundColor: colors.secondarySoft,
                },
                !canTogglePart && styles.partToggleDisabled,
              ]}
              onPress={handlePartToggle}
              disabled={!canTogglePart}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={
                canTogglePart
                  ? `الانتقال إلى ${targetPart === "first" ? "الجزء الأول" : "الجزء الثاني"}`
                  : "لا يوجد عنصر في الجزء الآخر"
              }
              accessibilityState={{ disabled: !canTogglePart }}
              testID="contents-part-toggle"
            >
              <AppIcon name="repeat" size={15} color={colors.secondary} />
              <Text style={[styles.partToggleText, { color: colors.foreground }]}>
                {targetPart === "first" ? "ج1" : "ج2"}
              </Text>
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>الفهرس</Text>
          </View>
        </View>
        <View style={[styles.searchRow, { backgroundColor: colors.input, borderColor: colors.borderStrong }]}>
          <AppIcon name="search" size={17} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            value={query}
            onChangeText={setQuery}
            placeholder="ابحث في الفهرس..."
            placeholderTextColor={colors.mutedForeground}
            autoCorrect={false}
            textAlign="right"
            selectionColor={colors.primary}
          />
          {query.length > 0 ? (
            <TouchableOpacity
              onPress={() => setQuery("")}
              style={styles.clearButton}
              accessibilityLabel="مسح بحث الفهرس"
            >
              <AppIcon name="x" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          ) : null}
        </View>
        <View style={styles.headerLine} />
      </View>

      {filteredContents.length > 0 ? (
        <FlatList
          ref={listRef}
          data={filteredContents}
          renderItem={renderItem}
           keyExtractor={(item) => `${item.book}-${item.entry.page}-${item.number}`}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: listBottomPad },
          ]}
          showsVerticalScrollIndicator={false}
          onScroll={(event) =>
            setShowScrollTop(event.nativeEvent.contentOffset.y > 260)
          }
          scrollEventThrottle={16}
          windowSize={10}
          maxToRenderPerBatch={20}
          initialNumToRender={20}
          removeClippedSubviews
        />
      ) : (
        <View style={[styles.empty, { paddingBottom: listBottomPad }]}>
          <AppIcon name="search" size={38} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>لا توجد عناوين</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>جرّب كلمة أخرى في الفهرس</Text>
        </View>
      )}

      {filteredContents.length > 0 ? (
        <BottomListFade bottom={0} />
      ) : null}

      {showScrollTop ? (
        <TouchableOpacity
          style={[
            styles.scrollTop,
            { backgroundColor: colors.primary, bottom: listBottomPad },
          ]}
          onPress={() => {
            listRef.current?.scrollToOffset({ offset: 0, animated: true });
            setShowScrollTop(false);
          }}
          activeOpacity={0.8}
          accessibilityLabel="العودة إلى أعلى الفهرس"
        >
          <AppIcon name="arrow-up" size={18} color={colors.primaryForeground} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#080E0C",
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 10,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 38,
  },
  titleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexShrink: 0,
  },
  headerTitle: {
    color: "#E8E0CC",
    fontSize: 26,
    fontFamily: "Cairo_700Bold",
    textAlign: "right",
  },
  fontControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  partToggle: {
    width: 48,
    height: 38,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    gap: 1,
    borderWidth: 1,
    flexShrink: 0,
  },
  partToggleDisabled: {
    opacity: 0.45,
  },
  partToggleText: {
    fontSize: 11,
    lineHeight: 13,
    fontFamily: "Cairo_700Bold",
    writingDirection: "ltr",
  },
  fontButton: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  fontSizeValue: {
    minWidth: 20,
    color: "#7A9590",
    fontSize: 11,
    fontFamily: "Cairo_600SemiBold",
    textAlign: "center",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0F1C18",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(232,224,204,0.62)",
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: "#E8E0CC",
    fontSize: 15,
    fontFamily: "Cairo_400Regular",
    paddingVertical: 11,
    textAlign: "right",
  },
  clearButton: {
    width: 28,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  headerLine: {
    height: 0,
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 4,
    gap: 10,
  },
  sectionDivider: {
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    paddingHorizontal: 8,
  },
  dividerSide: {
    flex: 1,
    maxWidth: 112,
    gap: 4,
  },
  dividerLine: {
    height: 1,
    backgroundColor: "rgba(184,164,106,0.52)",
  },
  dividerLineSoft: {
    height: 1,
    backgroundColor: "rgba(184,164,106,0.24)",
  },
  dividerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#B8A46A",
    borderWidth: 2,
    borderColor: "#080E0C",
  },
  card: {
    backgroundColor: "#0F1C18",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(232,224,204,0.62)",
    overflow: "hidden",
  },
  cardInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
  },
  cardNumber: {
    width: 42,
    height: 38,
    borderRadius: 8,
    backgroundColor: "rgba(0, 90, 86, 0.15)",
    borderWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  cardNumberText: {
    color: "#005A56",
    fontSize: 12,
    fontFamily: "Cairo_700Bold",
  },
  cardPartText: {
    fontSize: 9,
    lineHeight: 11,
    fontFamily: "Cairo_700Bold",
    writingDirection: "ltr",
  },
  cardPartBadge: {
    width: 34,
    height: 38,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    flex: 1,
    color: "#E8E0CC",
    fontSize: 15,
    fontFamily: "Cairo_600SemiBold",
    textAlign: "right",
    lineHeight: 24,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingBottom: 100,
  },
  emptyTitle: {
    color: "rgba(232,224,204,0.55)",
    fontSize: 16,
    fontFamily: "Cairo_600SemiBold",
  },
  emptyText: {
    color: "rgba(122,149,144,0.6)",
    fontSize: 13,
    fontFamily: "Cairo_400Regular",
  },
  scrollTop: {
    position: "absolute",
    right: 22,
    bottom: 110,
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,90,86,0.92)",
    borderWidth: 0,
    zIndex: 20,
    elevation: 12,
  },
});