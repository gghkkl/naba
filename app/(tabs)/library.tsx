import React from "react";
import {
  FlatList,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { AppIcon } from "@/components/AppIcon";
import { getBookCoverSource, LIBRARY_BOOKS } from "@/data/library";
import { useTheme } from "@/context/ThemeContext";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

export default function LibraryScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
  const { isChecking, isOffline, isRefreshing, refresh } = useNetworkStatus();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const cardWidth = (width - 52) / 2;
  const showConnectionState = isOffline || isChecking;

  const handleRetry = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    void refresh();
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 18 }]}>
        <View>
          <Text style={[styles.eyebrow, { color: colors.secondary }]}>NABA</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>المكتبة</Text>
        </View>
        <View style={[styles.countPill, { backgroundColor: colors.secondarySoft }]}>
          <AppIcon name="book-open" size={16} color={colors.secondary} />
          <Text style={[styles.countText, { color: colors.secondary }]}>
            {LIBRARY_BOOKS.length} كتاب
          </Text>
        </View>
      </View>

      {showConnectionState ? (
        <View style={styles.offlineState}>
          <View style={[styles.offlineIcon, { backgroundColor: colors.secondarySoft }]}>
            <AppIcon name="alert-circle" size={30} color={colors.secondary} />
          </View>
          <Text style={[styles.offlineTitle, { color: colors.foreground }]}>
            {isChecking ? "جارٍ التحقق من الاتصال" : "لا يتوفر اتصال بالإنترنت"}
          </Text>
          <Text style={[styles.offlineText, { color: colors.mutedForeground }]}>
            {isChecking
              ? "نختبر الاتصال الآن، وستظهر الكتب تلقائياً عند عودته."
              : "لا يمكن عرض كتب المكتبة الآن. افتح التنزيلات لقراءة الكتب المحفوظة على جهازك."}
          </Text>
          <TouchableOpacity
            style={[styles.offlineButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/(tabs)/downloads" as any)}
            activeOpacity={0.8}
          >
            <AppIcon name="download" size={16} color={colors.primaryForeground} />
            <Text style={styles.offlineButtonText}>الانتقال إلى التنزيلات</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.retryButton,
              {
                borderColor: colors.glassBorder,
                opacity: isRefreshing ? 0.55 : 1,
              },
            ]}
            onPress={handleRetry}
            disabled={isRefreshing}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="إعادة المحاولة"
            accessibilityState={{ disabled: isRefreshing, busy: isRefreshing }}
            testID="library-network-retry"
          >
            <AppIcon name="repeat" size={16} color={colors.secondary} />
            <Text style={[styles.retryText, { color: colors.secondary }]}>
              {isRefreshing ? "جارٍ التحقق..." : "إعادة المحاولة"}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={LIBRARY_BOOKS}
          numColumns={2}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.grid,
            { paddingBottom: Math.max(insets.bottom + 100, 112) },
          ]}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, { width: cardWidth }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(`/book/${item.id}` as any);
              }}
              activeOpacity={0.86}
              accessibilityRole="button"
              accessibilityLabel={`فتح كتاب ${item.title}`}
              testID={`library-book-${item.id}`}
            >
              <View
                style={[
                  styles.coverFrame,
                  { backgroundColor: colors.card, borderColor: colors.glassBorder },
                ]}
              >
                <Image source={getBookCoverSource(item)} style={styles.cover} resizeMode="cover" />
                <View style={[styles.coverShade, { backgroundColor: colors.scrim }]} />
                <View style={styles.coverMark}>
                  <Text style={styles.coverMarkText}>ن</Text>
                </View>
              </View>
              <Text style={[styles.bookTitle, { color: colors.foreground }]} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={[styles.bookAuthor, { color: colors.mutedForeground }]} numberOfLines={1}>
                {item.author}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 18,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  eyebrow: {
    fontFamily: "Cairo_700Bold",
    fontSize: 12,
    letterSpacing: 2,
    writingDirection: "ltr",
  },
  title: {
    fontFamily: "Cairo_700Bold",
    fontSize: 29,
    lineHeight: 40,
    textAlign: "right",
  },
  countPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 16,
    marginBottom: 4,
  },
  countText: {
    fontFamily: "Cairo_600SemiBold",
    fontSize: 11,
  },
  grid: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 22,
  },
  card: {
    alignItems: "stretch",
  },
  coverFrame: {
    aspectRatio: 0.69,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 9 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 7,
  },
  cover: {
    ...StyleSheet.absoluteFill,
  },
  coverShade: {
    ...StyleSheet.absoluteFill,
    opacity: 0.05,
  },
  coverMark: {
    position: "absolute",
    left: 10,
    bottom: 10,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(8,14,12,0.62)",
  },
  coverMarkText: {
    color: "#E8E0CC",
    fontFamily: "Cairo_700Bold",
    fontSize: 15,
  },
  bookTitle: {
    fontFamily: "Cairo_700Bold",
    fontSize: 14,
    lineHeight: 23,
    textAlign: "right",
    marginTop: 9,
  },
  bookAuthor: {
    fontFamily: "Cairo_400Regular",
    fontSize: 11,
    textAlign: "right",
    marginTop: 2,
  },
  offlineState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 36,
    paddingBottom: 82,
  },
  offlineIcon: {
    width: 70,
    height: 70,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  offlineTitle: {
    fontFamily: "Cairo_700Bold",
    fontSize: 18,
    textAlign: "center",
  },
  offlineText: {
    fontFamily: "Cairo_400Regular",
    fontSize: 13,
    lineHeight: 23,
    textAlign: "center",
    marginTop: 6,
  },
  offlineButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderRadius: 13,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginTop: 18,
  },
  offlineButtonText: {
    color: "#FFFFFF",
    fontFamily: "Cairo_700Bold",
    fontSize: 13,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderWidth: 1,
    borderRadius: 13,
    paddingHorizontal: 18,
    paddingVertical: 9,
    marginTop: 10,
  },
  retryText: {
    fontFamily: "Cairo_700Bold",
    fontSize: 12,
  },
});
