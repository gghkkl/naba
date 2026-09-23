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
      const response = await fetch(`${API()}${includeDrafts ? "/admin/books" : "/books"}`);
      if (!response.ok) throw new Error("تعذر تحميل المكتبة");
      const data = (await response.json()) as { books: LibraryBook[] };
      setBooks(data.books);
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