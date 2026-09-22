import React from "react";
import {
  Alert,
  FlatList,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { AppIcon } from "@/components/AppIcon";
import { getBookCoverSource, LIBRARY_BOOKS } from "@/data/library";
import { useLibrary } from "@/context/LibraryContext";
import { useTheme } from "@/context/ThemeContext";

export default function DownloadsScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { downloads, deleteDownload, downloadBook } = useLibrary();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const downloadedBooks = LIBRARY_BOOKS.filter((book) => downloads[book.id]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 18 }]}>
        <Text style={[styles.eyebrow, { color: colors.secondary }]}>OFFLINE</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>التنزيلات</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          كتبك المحفوظة داخل التطبيق
        </Text>
      </View>

      {downloadedBooks.length === 0 ? (
        <View style={styles.empty}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.secondarySoft }]}>
            <AppIcon name="download" size={30} color={colors.secondary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            لا توجد كتب محملة
          </Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            حمّل كتاباً من صفحة معلوماته ليظهر هنا وتقرأه دون اتصال.
          </Text>
          <TouchableOpacity
            style={[styles.emptyButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/(tabs)/library" as any)}
            activeOpacity={0.8}
          >
            <Text style={styles.emptyButtonText}>تصفح المكتبة</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={downloadedBooks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: Math.max(insets.bottom + 100, 112) },
          ]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const download = downloads[item.id];
            const isComplete = download?.status === "downloaded";
            const hasError = download?.status === "error";
            return (
              <View
                style={[
                  styles.item,
                  { backgroundColor: colors.card, borderColor: colors.glassBorder },
                ]}
              >
                <Image
                  source={getBookCoverSource(item, download?.localCoverUri)}
                  style={styles.cover}
                  resizeMode="cover"
                />
                <View style={styles.itemBody}>
                  <Text style={[styles.itemTitle, { color: colors.foreground }]} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={[styles.itemAuthor, { color: colors.mutedForeground }]} numberOfLines={1}>
                    {item.author}
                  </Text>
                  {isComplete ? (
                    <View style={styles.statusRow}>
                      <AppIcon name="check" size={14} color={colors.secondary} />
                      <Text style={[styles.statusText, { color: colors.secondary }]}>
                        متاح بدون إنترنت
                      </Text>
                    </View>
                  ) : hasError ? (
                    <Text style={[styles.statusText, { color: colors.destructive }]}>
                      تعذر التنزيل
                    </Text>
                  ) : (
                    <Text style={[styles.statusText, { color: colors.secondary }]}>
                      جاري التنزيل {Math.round((download?.progress ?? 0) * 100)}٪
                    </Text>
                  )}
                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={[styles.readButton, { backgroundColor: colors.primary }]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.push(`/reader/${item.id}` as any);
                      }}
                      activeOpacity={0.82}
                    >
                      <AppIcon name="book-open" size={15} color={colors.primaryForeground} />
                      <Text style={styles.readText}>قراءة</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() =>
                        Alert.alert(
                          "حذف التنزيل",
                          "سيبقى الكتاب في المكتبة، لكن ستُحذف نسخته المحفوظة من الجهاز.",
                          [
                            { text: "إلغاء", style: "cancel" },
                            {
                              text: "حذف",
                              style: "destructive",
                              onPress: () => deleteDownload(item.id),
                            },
                          ],
                        )
                      }
                      activeOpacity={0.8}
                      accessibilityLabel="حذف تنزيل الكتاب"
                    >
                      <AppIcon name="trash-2" size={17} color={colors.destructive} />
                    </TouchableOpacity>
                    {hasError ? (
                      <TouchableOpacity
                        style={[styles.retryButton, { borderColor: colors.glassBorder }]}
                        onPress={() => downloadBook(item)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.retryText, { color: colors.secondary }]}>
                          إعادة المحاولة
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              </View>
            );
          }}
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
  },
  eyebrow: {
    fontFamily: "Cairo_700Bold",
    fontSize: 11,
    letterSpacing: 2,
    writingDirection: "ltr",
  },
  title: {
    fontFamily: "Cairo_700Bold",
    fontSize: 29,
    lineHeight: 40,
    textAlign: "right",
  },
  subtitle: {
    fontFamily: "Cairo_400Regular",
    fontSize: 13,
    textAlign: "right",
    marginTop: 3,
  },
  list: {
    paddingHorizontal: 20,
    gap: 12,
  },
  item: {
    flexDirection: "row-reverse",
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
    gap: 13,
  },
  cover: {
    width: 78,
    height: 112,
    borderRadius: 12,
  },
  itemBody: {
    flex: 1,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  itemTitle: {
    width: "100%",
    fontFamily: "Cairo_700Bold",
    fontSize: 15,
    lineHeight: 24,
    textAlign: "right",
  },
  itemAuthor: {
    width: "100%",
    fontFamily: "Cairo_400Regular",
    fontSize: 11,
    textAlign: "right",
    marginTop: 2,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 7,
  },
  statusText: {
    fontFamily: "Cairo_600SemiBold",
    fontSize: 11,
    textAlign: "right",
    marginTop: 7,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 10,
  },
  readButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 11,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  readText: {
    color: "#FFFFFF",
    fontFamily: "Cairo_700Bold",
    fontSize: 11,
  },
  deleteButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  retryButton: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  retryText: {
    fontFamily: "Cairo_700Bold",
    fontSize: 10,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 38,
    paddingBottom: 90,
  },
  emptyIcon: {
    width: 70,
    height: 70,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  emptyTitle: {
    fontFamily: "Cairo_700Bold",
    fontSize: 18,
  },
  emptyText: {
    fontFamily: "Cairo_400Regular",
    fontSize: 13,
    lineHeight: 23,
    textAlign: "center",
    marginTop: 5,
  },
  emptyButton: {
    borderRadius: 13,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginTop: 18,
  },
  emptyButtonText: {
    color: "#FFFFFF",
    fontFamily: "Cairo_700Bold",
    fontSize: 13,
  },
});
