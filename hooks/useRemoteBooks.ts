import { useCallback, useEffect, useState } from "react";
import { LIBRARY_BOOKS, type LibraryBook } from "@/data/library";

const API = () => `https://${process.env.EXPO_PUBLIC_DOMAIN ?? ""}/api`;

export function useRemoteBooks(includeDrafts = false) {
  const [books, setBooks] = useState<LibraryBook[]>(LIBRARY_BOOKS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      if (includeDrafts) throw new Error("تتوفر إدارة الكتب عبر موقع الموظفين فقط");
      const response = await fetch(`${API()}/books`);
      if (!response.ok) throw new Error("تعذر تحميل المكتبة");
      const data = (await response.json()) as { books: LibraryBook[] };
      const bundledById = new Map(LIBRARY_BOOKS.map((book) => [book.id, book]));
      setBooks(data.books.map((remoteBook) => {
        const bundledBook = bundledById.get(remoteBook.id);
        if (!bundledBook) return remoteBook;
        return {
          ...bundledBook,
          ...remoteBook,
          coverAsset:
            remoteBook.coverUrl === bundledBook.coverUrl
              ? bundledBook.coverAsset
              : undefined,
          pageAssets:
            remoteBook.pdfUrl === bundledBook.pdfUrl &&
            remoteBook.pageUrlTemplate === bundledBook.pageUrlTemplate
              ? bundledBook.pageAssets
              : undefined,
        };
      }));
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر تحميل المكتبة");
    } finally {
      setLoading(false);
    }
  }, [includeDrafts]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { books, loading, error, refresh };
}