import React from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { AppIcon } from "@/components/AppIcon";
import { getBookCoverSource, getLibraryBook } from "@/data/library";
import { useLibrary } from "@/context/LibraryContext";
import { useTheme } from "@/context/ThemeContext";

export default function BookDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const book = getLibraryBook(id ?? "");
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { downloads, progress, downloadBook } = useLibrary();
  const download = book ? downloads[book.id] : undefined;
  const currentPage = book ? progress[book.id] ?? 1 : 1;

  if (!book) {
    return (
      <View style={[styles.empty, { backgroundColor: colors.background }]}>
        <Text style={[styles.emptyText, { color: colors.foreground }]}>الكتاب غير موجود</Text>
      </View>
    );
  }

  const isDownloading = download?.status === "downloading";
  const isDownloaded = download?.status === "downloaded";

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: (Platform.OS === "web" ? 67 : insets.top) + 18,
            paddingBottom: insets.bottom + 32,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: colors.glass }]}
            onPress={() => router.back()}
            activeOpacity={0.8}
            accessibilityLabel="العودة"
          >
            <AppIcon name="arrow-right" size={20} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.topLabel, { color: colors.secondary }]}>تفاصيل الكتاب</Text>
        </View>

        <View style={styles.hero}>
          <View style={[styles.coverShell, { borderColor: colors.glassBorder }]}>
            <Image
              source={getBookCoverSource(book, download?.localCoverUri)}
              style={styles.cover}
              resizeMode="cover"
            />
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>{book.title}</Text>
          <Text style={[styles.author, { color: colors.secondary }]}>{book.author}</Text>
          {progress[book.id] ? (
            <Text style={[styles.progress, { color: colors.mutedForeground }]}>
              وصلت إلى الصفحة {currentPage} من {book.pageCount}
            </Text>
          ) : null}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.primaryAction, { backgroundColor: colors.primary }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push(`/reader/${book.id}` as any);
            }}
            activeOpacity={0.82}
          >
            <AppIcon name="book-open" size={18} color={colors.primaryForeground} />
            <Text style={styles.primaryActionText}>
              {progress[book.id] ? "أكمل القراءة" : "اقرأ الكتاب"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.secondaryAction,
              { borderColor: colors.secondary, backgroundColor: colors.secondarySoft },
            ]}
            onPress={() => {
              if (isDownloaded || isDownloading) return;
              void downloadBook(book);
            }}
            activeOpacity={0.82}
            disabled={isDownloaded || isDownloading}
          >
            {isDownloading ? (
              <ActivityIndicator size="small" color={colors.secondary} />
            ) : (
              <AppIcon
                name={isDownloaded ? "check" : "download"}
                size={18}
                color={colors.secondary}
              />
            )}
            <Text style={[styles.secondaryActionText, { color: colors.secondary }]}>
              {isDownloaded
                ? "محمل داخل التطبيق"
                : isDownloading
                  ? `جاري التنزيل ${Math.round((download?.progress ?? 0) * 100)}٪`
                  : "تحميل للقراءة دون اتصال"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.glassBorder }]} />
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>عن الكتاب</Text>
        <Text style={[styles.description, { color: colors.mutedForeground }]}>
          {book.description}
        </Text>

        <View style={[styles.meta, { backgroundColor: colors.card, borderColor: colors.glassBorder }]}>
          <MetaRow label="الناشر" value={book.publisher} colors={colors} />
          <MetaRow label="تاريخ الإصدار" value={book.releaseDate} colors={colors} />
          <MetaRow label="لغة الكتاب الأصلية" value={book.originalLanguage} colors={colors} />
          <MetaRow label="الترجمة العربية" value={book.translation} colors={colors} />
          <MetaRow label="عدد الصفحات" value={`${book.pageCount} صفحة`} colors={colors} />
        </View>
      </ScrollView>
    </View>
  );
}

function MetaRow({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: ReturnType<typeof useTheme>["colors"];
}) {
  return (
    <View style={styles.metaRow}>
      <Text style={[styles.metaValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 22,
  },
  topLabel: {
    fontFamily: "Cairo_600SemiBold",
    fontSize: 13,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  hero: { alignItems: "center" },
  coverShell: {
    width: 180,
    height: 260,
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.27,
    shadowRadius: 18,
    elevation: 9,
  },
  cover: { width: "100%", height: "100%" },
  title: {
    fontFamily: "Cairo_700Bold",
    fontSize: 25,
    textAlign: "center",
    marginTop: 18,
  },
  author: {
    fontFamily: "Cairo_600SemiBold",
    fontSize: 12,
    textAlign: "center",
    marginTop: 3,
  },
  progress: {
    fontFamily: "Cairo_400Regular",
    fontSize: 11,
    marginTop: 6,
  },
  actions: { gap: 10, marginTop: 23 },
  primaryAction: {
    minHeight: 52,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryActionText: {
    color: "#FFFFFF",
    fontFamily: "Cairo_700Bold",
    fontSize: 15,
  },
  secondaryAction: {
    minHeight: 48,
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  secondaryActionText: {
    fontFamily: "Cairo_600SemiBold",
    fontSize: 12,
  },
  divider: { height: 1, marginVertical: 26 },
  sectionTitle: {
    fontFamily: "Cairo_700Bold",
    fontSize: 19,
    textAlign: "right",
  },
  description: {
    fontFamily: "Cairo_400Regular",
    fontSize: 14,
    lineHeight: 28,
    textAlign: "right",
    marginTop: 8,
  },
  meta: {
    borderRadius: 17,
    borderWidth: 1,
    padding: 15,
    gap: 13,
    marginTop: 22,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 14,
  },
  metaLabel: {
    fontFamily: "Cairo_400Regular",
    fontSize: 11,
    textAlign: "right",
  },
  metaValue: {
    flex: 1,
    fontFamily: "Cairo_600SemiBold",
    fontSize: 12,
    textAlign: "left",
  },
  empty: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { fontFamily: "Cairo_700Bold", fontSize: 18 },
});
