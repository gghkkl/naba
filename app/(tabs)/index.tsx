import React from "react";
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { AppIcon } from "@/components/AppIcon";
import { getBookCoverSource, NABA_BOOK } from "@/data/library";
import { useLibrary } from "@/context/LibraryContext";
import { useTheme } from "@/context/ThemeContext";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { colors, mode, toggleTheme } = useTheme();
  const { progress, downloads } = useLibrary();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const currentPage = progress[NABA_BOOK.id];
  const hasStarted = typeof currentPage === "number" && currentPage > 1;
  const percentage = currentPage
    ? Math.min(100, Math.round((currentPage / NABA_BOOK.pageCount) * 100))
    : 0;
  const download = downloads[NABA_BOOK.id];
  const isDownloaded = download?.status === "downloaded";
  const coverSource = getBookCoverSource(NABA_BOOK, download?.localCoverUri);

  const openReader = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/reader/${NABA_BOOK.id}` as any);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={colors.backgroundGradient}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: topPad + 14,
            paddingBottom: Math.max(insets.bottom + 104, 116),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={[
              styles.themeButton,
              { backgroundColor: colors.card, borderColor: colors.glassBorder },
            ]}
            onPress={toggleTheme}
            activeOpacity={0.8}
            accessibilityLabel={mode === "dark" ? "الوضع الصباحي" : "الوضع الليلي"}
          >
            <AppIcon
              name={mode === "dark" ? "sun" : "moon"}
              size={18}
              color={colors.secondary}
            />
          </TouchableOpacity>
          <View style={styles.wordmark}>
            <Text style={[styles.wordmarkLatin, { color: colors.secondary }]}>
              NABA
            </Text>
            <Text style={[styles.wordmarkArabic, { color: colors.foreground }]}>
              مكتبة نبأ
            </Text>
          </View>
        </View>

        <View style={styles.intro}>
          <Text style={[styles.kicker, { color: colors.secondary }]}>
            {hasStarted ? "مرحباً بعودتك" : "مرحباً بك في نبأ"}
          </Text>
          <Text style={[styles.heading, { color: colors.foreground }]}>
            {hasStarted ? "أكمل من حيث توقفت" : "ابدأ قراءتك بهدوء"}
          </Text>
          <Text style={[styles.subheading, { color: colors.mutedForeground }]}>
            {hasStarted
              ? `صفحة ${currentPage} بانتظارك`
              : "كتاب واحد الآن، ومكتبة تتسع مع الوقت"}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.readingCard,
            { backgroundColor: colors.card, borderColor: colors.glassBorder },
          ]}
          onPress={openReader}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel={hasStarted ? "متابعة القراءة" : "بدء القراءة"}
        >
          <Image
            source={coverSource}
            style={styles.cover}
            resizeMode="cover"
          />
          <View style={styles.readingBody}>
            <View style={styles.cardTopline}>
              <Text style={[styles.cardKicker, { color: colors.secondary }]}>
                {hasStarted ? `${percentage}٪ من الكتاب` : "كتابك الأول"}
              </Text>
              <AppIcon name="arrow-left" size={18} color={colors.secondary} />
            </View>
            <Text
              style={[styles.bookTitle, { color: colors.foreground }]}
              numberOfLines={2}
            >
              {NABA_BOOK.title}
            </Text>
            <Text
              style={[styles.bookAuthor, { color: colors.mutedForeground }]}
              numberOfLines={1}
            >
              {NABA_BOOK.author}
            </Text>
            {hasStarted ? (
              <View
                style={[
                  styles.progressTrack,
                  { backgroundColor: colors.secondarySoft },
                ]}
              >
                <View
                  style={[
                    styles.progressValue,
                    {
                      backgroundColor: colors.secondary,
                      width: `${Math.max(percentage, 4)}%`,
                    },
                  ]}
                />
              </View>
            ) : (
              <Text
                style={[styles.bookMeta, { color: colors.mutedForeground }]}
              >
                {NABA_BOOK.pageCount} صفحة · {NABA_BOOK.status}
              </Text>
            )}
            <View style={styles.cardBottom}>
              <Text style={[styles.actionText, { color: colors.primary }]}>
                {hasStarted ? `تابع من الصفحة ${currentPage}` : "ابدأ القراءة"}
              </Text>
              {isDownloaded ? (
                <View style={styles.offlineRow}>
                  <AppIcon name="check" size={13} color={colors.secondary} />
                  <Text
                    style={[styles.offlineText, { color: colors.secondary }]}
                  >
                    متاح دون اتصال
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.secondaryHeader}>
          <Text style={[styles.secondaryTitle, { color: colors.foreground }]}>
            ماذا تريد أن تفعل؟
          </Text>
        </View>
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[
              styles.quickAction,
              { backgroundColor: colors.card, borderColor: colors.glassBorder },
            ]}
            onPress={() => router.push("/(tabs)/library" as any)}
            activeOpacity={0.82}
            accessibilityRole="button"
            accessibilityLabel="فتح المكتبة"
          >
            <AppIcon name="book-open" size={18} color={colors.secondary} />
            <View style={styles.quickActionText}>
              <Text
                style={[styles.quickActionTitle, { color: colors.foreground }]}
              >
                تصفح المكتبة
              </Text>
              <Text
                style={[
                  styles.quickActionCaption,
                  { color: colors.mutedForeground },
                ]}
              >
                اكتشف الكتب
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.quickAction,
              { backgroundColor: colors.card, borderColor: colors.glassBorder },
            ]}
            onPress={() => router.push("/(tabs)/downloads" as any)}
            activeOpacity={0.82}
            accessibilityRole="button"
            accessibilityLabel="فتح التنزيلات"
          >
            <AppIcon name="download" size={18} color={colors.secondary} />
            <View style={styles.quickActionText}>
              <Text
                style={[styles.quickActionTitle, { color: colors.foreground }]}
              >
                التنزيلات
              </Text>
              <Text
                style={[
                  styles.quickActionCaption,
                  { color: colors.mutedForeground },
                ]}
              >
                اقرأ دون اتصال
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  themeButton: {
    width: 42,
    height: 42,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  wordmark: { alignItems: "flex-end" },
  wordmarkLatin: {
    fontFamily: "Cairo_700Bold",
    fontSize: 11,
    letterSpacing: 3,
    writingDirection: "ltr",
  },
  wordmarkArabic: {
    fontFamily: "Cairo_700Bold",
    fontSize: 17,
    lineHeight: 25,
  },
  intro: {
    alignItems: "flex-end",
    marginTop: 31,
    marginBottom: 20,
  },
  kicker: {
    fontFamily: "Cairo_600SemiBold",
    fontSize: 12,
    textAlign: "right",
  },
  heading: {
    width: "100%",
    fontFamily: "Cairo_700Bold",
    fontSize: 27,
    lineHeight: 39,
    textAlign: "right",
    marginTop: 3,
  },
  subheading: {
    width: "100%",
    fontFamily: "Cairo_400Regular",
    fontSize: 12,
    textAlign: "right",
    marginTop: 1,
  },
  readingCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 13,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 14,
  },
  cover: {
    width: 111,
    height: 160,
    borderRadius: 16,
  },
  readingBody: {
    flex: 1,
    minWidth: 0,
    alignItems: "flex-end",
  },
  cardTopline: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardKicker: {
    fontFamily: "Cairo_600SemiBold",
    fontSize: 11,
    textAlign: "right",
  },
  bookTitle: {
    width: "100%",
    fontFamily: "Cairo_700Bold",
    fontSize: 17,
    lineHeight: 27,
    textAlign: "right",
    marginTop: 7,
  },
  bookAuthor: {
    width: "100%",
    fontFamily: "Cairo_400Regular",
    fontSize: 10,
    lineHeight: 18,
    textAlign: "right",
    marginTop: 1,
  },
  bookMeta: {
    width: "100%",
    fontFamily: "Cairo_400Regular",
    fontSize: 10,
    textAlign: "right",
    marginTop: 13,
  },
  progressTrack: {
    width: "100%",
    height: 5,
    borderRadius: 5,
    overflow: "hidden",
    marginTop: 15,
  },
  progressValue: {
    height: "100%",
    borderRadius: 5,
  },
  cardBottom: {
    width: "100%",
    alignItems: "flex-end",
    marginTop: 12,
  },
  actionText: {
    fontFamily: "Cairo_700Bold",
    fontSize: 12,
    textAlign: "right",
  },
  offlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 5,
  },
  offlineText: {
    fontFamily: "Cairo_600SemiBold",
    fontSize: 10,
  },
  secondaryHeader: {
    marginTop: 27,
    marginBottom: 11,
  },
  secondaryTitle: {
    fontFamily: "Cairo_700Bold",
    fontSize: 16,
    textAlign: "right",
  },
  quickActions: {
    flexDirection: "row-reverse",
    gap: 10,
  },
  quickAction: {
    flex: 1,
    minHeight: 70,
    borderRadius: 17,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 10,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 9,
  },
  quickActionText: {
    flex: 1,
    minWidth: 0,
    alignItems: "flex-end",
  },
  quickActionTitle: {
    width: "100%",
    fontFamily: "Cairo_700Bold",
    fontSize: 11,
    textAlign: "right",
  },
  quickActionCaption: {
    width: "100%",
    fontFamily: "Cairo_400Regular",
    fontSize: 9,
    textAlign: "right",
    marginTop: 1,
  },
});