import React, { useCallback, useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppIcon } from "@/components/AppIcon";
import { LibraryPageViewer } from "@/components/LibraryPageViewer";
import { ReaderPageControls } from "@/components/ReaderPageControls";
import { getLibraryBook } from "@/data/library";
import { useLibrary } from "@/context/LibraryContext";
import { useTheme } from "@/context/ThemeContext";

export default function ReaderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const book = getLibraryBook(id ?? "");
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { progress, downloads, setProgress } = useLibrary();
  const [page, setPage] = useState(progress[id ?? ""] ?? 1);

  const handlePageChange = useCallback(
    (nextPage: number) => {
      if (!book) return;
      const bounded = Math.min(book.pageCount, Math.max(1, Math.round(nextPage)));
      setPage(bounded);
      setProgress(book.id, bounded);
    },
    [book, setProgress],
  );

  if (!book) {
    return (
      <View style={[styles.empty, { backgroundColor: colors.background }]}>
        <Text style={[styles.emptyText, { color: colors.foreground }]}>الكتاب غير موجود</Text>
      </View>
    );
  }

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const downloaded = downloads[book.id]?.status === "downloaded";

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <LibraryPageViewer
        book={book}
        page={page}
        bottomInset={insets.bottom + 88}
        onPageChange={handlePageChange}
      />
      <View style={[styles.header, { top: topPad + 10 }]}>
        <TouchableOpacity
          style={[styles.back, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}
          onPress={() => router.back()}
          activeOpacity={0.8}
          accessibilityLabel="العودة إلى تفاصيل الكتاب"
        >
          <AppIcon name="arrow-right" size={19} color={colors.foreground} />
        </TouchableOpacity>
        <View style={[styles.titlePlate, { backgroundColor: colors.glass }]}>
          <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>
            {book.title}
          </Text>
          {downloaded ? (
            <Text style={[styles.offline, { color: colors.secondary }]}>بدون اتصال</Text>
          ) : null}
        </View>
      </View>
      <ReaderPageControls
        page={page}
        totalPages={book.pageCount}
        bottomInset={insets.bottom}
        onPageChange={handlePageChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    position: "absolute",
    left: 14,
    right: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    zIndex: 10,
  },
  back: {
    width: 42,
    height: 42,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  titlePlate: {
    maxWidth: "78%",
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: "flex-end",
  },
  title: {
    fontFamily: "Cairo_600SemiBold",
    fontSize: 12,
  },
  offline: {
    fontFamily: "Cairo_400Regular",
    fontSize: 9,
    marginTop: 1,
  },
  empty: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { fontFamily: "Cairo_700Bold", fontSize: 18 },
});
