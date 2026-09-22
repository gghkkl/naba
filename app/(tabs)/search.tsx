import React, { useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Platform,
  StyleSheet,
  Text,
  TextInput,
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

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { downloads } = useLibrary();
  const [query, setQuery] = useState("");
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const results = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return [];
    return LIBRARY_BOOKS.filter((book) =>
      [book.title, book.author, book.description, book.publisher]
        .join(" ")
        .toLocaleLowerCase()
        .includes(normalized),
    );
  }, [query]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 18 }]}>
        <Text style={[styles.eyebrow, { color: colors.secondary }]}>NABA</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>البحث</Text>
        <View
          style={[
            styles.searchBox,
            { backgroundColor: colors.input, borderColor: colors.glassBorder },
          ]}
        >
          <AppIcon name="search" size={18} color={colors.mutedForeground} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            style={[styles.input, { color: colors.foreground }]}
            placeholder="ابحث في الكتب المحملة..."
            placeholderTextColor={colors.mutedForeground}
            textAlign="right"
            autoCorrect={false}
            returnKeyType="search"
          />
          {query ? (
            <TouchableOpacity onPress={() => setQuery("")} activeOpacity={0.7}>
              <AppIcon name="x" size={17} color={colors.mutedForeground} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {!query.trim() ? (
        <View style={styles.empty}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.secondarySoft }]}>
            <AppIcon name="search" size={29} color={colors.secondary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>ابحث في مكتبتك</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            البحث يعمل محلياً، حتى عندما لا يكون لديك اتصال بالإنترنت.
          </Text>
        </View>
      ) : results.length === 0 ? (
        <View style={styles.empty}>
          <AppIcon name="search" size={38} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>لا توجد نتائج</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            لم نعثر على «{query}» في مكتبتك.
          </Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.results,
            { paddingBottom: Math.max(insets.bottom + 100, 112) },
          ]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const downloaded = downloads[item.id]?.status === "downloaded";
            return (
              <TouchableOpacity
                style={[styles.result, { backgroundColor: colors.card, borderColor: colors.glassBorder }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push(`/book/${item.id}` as any);
                }}
                activeOpacity={0.84}
              >
                <Image
                  source={getBookCoverSource(item, downloads[item.id]?.localCoverUri)}
                  style={styles.cover}
                  resizeMode="cover"
                />
                <View style={styles.resultBody}>
                  <Text style={[styles.resultTitle, { color: colors.foreground }]}>{item.title}</Text>
                  <Text style={[styles.resultAuthor, { color: colors.mutedForeground }]} numberOfLines={1}>
                    {item.author}
                  </Text>
                  <Text style={[styles.resultExcerpt, { color: colors.mutedForeground }]} numberOfLines={2}>
                    {item.description}
                  </Text>
                  <Text style={[styles.resultStatus, { color: colors.secondary }]}>
                    {downloaded ? "محفوظ للقراءة دون اتصال" : "متاح للتنزيل"}
                  </Text>
                </View>
                <AppIcon name="arrow-left" size={18} color={colors.secondary} />
              </TouchableOpacity>
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
    gap: 2,
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
  searchBox: {
    minHeight: 49,
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 13,
    marginTop: 14,
  },
  input: {
    flex: 1,
    fontFamily: "Cairo_400Regular",
    fontSize: 14,
    paddingVertical: 8,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 36,
    paddingBottom: 94,
  },
  emptyIcon: {
    width: 68,
    height: 68,
    borderRadius: 23,
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
  results: {
    paddingHorizontal: 20,
    gap: 12,
  },
  result: {
    minHeight: 132,
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
  },
  cover: {
    width: 72,
    height: 104,
    borderRadius: 11,
  },
  resultBody: {
    flex: 1,
    alignItems: "flex-end",
  },
  resultTitle: {
    width: "100%",
    fontFamily: "Cairo_700Bold",
    fontSize: 15,
    textAlign: "right",
  },
  resultAuthor: {
    width: "100%",
    fontFamily: "Cairo_400Regular",
    fontSize: 10,
    textAlign: "right",
    marginTop: 1,
  },
  resultExcerpt: {
    width: "100%",
    fontFamily: "Cairo_400Regular",
    fontSize: 11,
    lineHeight: 18,
    textAlign: "right",
    marginTop: 7,
  },
  resultStatus: {
    width: "100%",
    fontFamily: "Cairo_600SemiBold",
    fontSize: 10,
    textAlign: "right",
    marginTop: 6,
  },
});
