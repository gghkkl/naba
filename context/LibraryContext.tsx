import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "@clerk/expo";
import { LibraryBook } from "@/data/library";
import { apiFetch } from "@/lib/api";

const STORAGE_KEY = "@naba/library-state-v1";
const DOWNLOAD_DIRECTORY = `${FileSystem.documentDirectory ?? ""}naba-library/`;

export type DownloadRecord = {
  status: "downloading" | "downloaded" | "error";
  progress: number;
  localPdfUri?: string;
  localCoverUri?: string;
  localPageDirectory?: string;
  downloadedPageCount?: number;
  error?: string;
};

type LibrarySnapshot = {
  progress: Record<string, number>;
  downloads: Record<string, DownloadRecord>;
};

type LibraryContextValue = LibrarySnapshot & {
  ready: boolean;
  preferencesReady: boolean;
  favoriteBookIds: Record<string, true>;
  savedBookIds: Record<string, true>;
  setProgress: (bookId: string, page: number) => void;
  downloadBook: (book: LibraryBook) => Promise<void>;
  deleteDownload: (bookId: string) => Promise<void>;
  toggleFavorite: (bookId: string) => Promise<void>;
  toggleSavedBook: (bookId: string) => Promise<void>;
};

const initialSnapshot: LibrarySnapshot = {
  progress: {},
  downloads: {},
};

const LibraryCtx = createContext<LibraryContextValue | null>(null);

async function ensureDownloadDirectory() {
  if (!FileSystem.documentDirectory) {
    throw new Error("مساحة التخزين الخاصة بالتطبيق غير متاحة");
  }
  await FileSystem.makeDirectoryAsync(DOWNLOAD_DIRECTORY, {
    intermediates: true,
  }).catch(() => undefined);
}

function pageDirectoryFor(bookId: string) {
  return `${DOWNLOAD_DIRECTORY}${bookId}-pages/`;
}

export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn } = useAuth();
  const [snapshot, setSnapshot] = useState<LibrarySnapshot>(initialSnapshot);
  const [ready, setReady] = useState(false);
  const [preferencesReady, setPreferencesReady] = useState(!isSignedIn);
  const [favoriteBookIds, setFavoriteBookIds] = useState<Record<string, true>>({});
  const [savedBookIds, setSavedBookIds] = useState<Record<string, true>>({});

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (!active) return;
        if (value) {
          try {
            const parsed = JSON.parse(value) as LibrarySnapshot;
            setSnapshot({
              progress: parsed.progress ?? {},
              downloads: parsed.downloads ?? {},
            });
          } catch {
            setSnapshot(initialSnapshot);
          }
        }
        setReady(true);
      })
      .catch(() => {
        if (active) setReady(true);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    if (!isSignedIn) {
      setFavoriteBookIds({});
      setSavedBookIds({});
      setPreferencesReady(true);
      return () => {
        active = false;
      };
    }

    setPreferencesReady(false);
    apiFetch<{ favoriteBookIds: string[]; savedBookIds: string[] }>("/api/me/preferences")
      .then((data) => {
        if (!active) return;
        setFavoriteBookIds(
          Object.fromEntries(data.favoriteBookIds.map((bookId) => [bookId, true])),
        );
        setSavedBookIds(
          Object.fromEntries(data.savedBookIds.map((bookId) => [bookId, true])),
        );
      })
      .catch(() => {
        if (!active) return;
        setFavoriteBookIds({});
        setSavedBookIds({});
      })
      .finally(() => {
        if (active) setPreferencesReady(true);
      });

    return () => {
      active = false;
    };
  }, [isSignedIn]);

  const persist = useCallback((next: LibrarySnapshot) => {
    setSnapshot(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(
      () => undefined,
    );
  }, []);

  const updateDownload = useCallback(
    (bookId: string, patch: Partial<DownloadRecord>) => {
      setSnapshot((current) => {
        const currentRecord = current.downloads[bookId] ?? {
          status: "downloading" as const,
          progress: 0,
        };
        const nextRecord = { ...currentRecord, ...patch };
        const next = {
          ...current,
          downloads: { ...current.downloads, [bookId]: nextRecord },
        };
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(
          () => undefined,
        );
        return next;
      });
    },
    [],
  );

  const setProgress = useCallback((bookId: string, page: number) => {
    const nextPage = Math.max(1, Math.round(page));
    setSnapshot((current) => {
      const next = {
        ...current,
        progress: { ...current.progress, [bookId]: nextPage },
      };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(
        () => undefined,
      );
      return next;
    });
  }, []);

  const downloadBook = useCallback(
    async (book: LibraryBook) => {
      const existing = snapshot.downloads[book.id];
      if (existing?.status === "downloading") return;

      const startRecord: DownloadRecord = {
        status: "downloading",
        progress: existing?.progress ?? 0,
        localPdfUri: existing?.localPdfUri,
        localCoverUri: existing?.localCoverUri,
        localPageDirectory: existing?.localPageDirectory,
        downloadedPageCount: existing?.downloadedPageCount ?? 0,
      };
      updateDownload(book.id, startRecord);

      try {
        await ensureDownloadDirectory();
        const pdfUri = `${DOWNLOAD_DIRECTORY}${book.id}.pdf`;
        const coverUri = `${DOWNLOAD_DIRECTORY}${book.id}-cover.jpg`;
        const hasBundledPages =
          book.pageAssets?.length === book.pageCount;
        const pageDirectory = hasBundledPages
          ? undefined
          : pageDirectoryFor(book.id);
        if (pageDirectory) {
          await FileSystem.makeDirectoryAsync(pageDirectory, {
            intermediates: true,
          }).catch(() => undefined);
        }
        const [pdfInfo, coverInfo] = await Promise.all([
          FileSystem.getInfoAsync(pdfUri),
          FileSystem.getInfoAsync(coverUri),
        ]);
        const [pdf, cover] = await Promise.all([
          pdfInfo.exists
            ? Promise.resolve({ uri: pdfUri })
            : FileSystem.downloadAsync(book.pdfUrl, pdfUri),
          coverInfo.exists
            ? Promise.resolve({ uri: coverUri })
            : FileSystem.downloadAsync(book.coverUrl, coverUri),
        ]);
        updateDownload(book.id, {
          status: "downloading",
          progress: hasBundledPages ? 0.9 : 0.1,
          localPdfUri: pdf.uri,
          localCoverUri: cover.uri,
          localPageDirectory: pageDirectory,
          error: undefined,
        });

        if (pageDirectory) {
          const pageUris = Array.from(
            { length: book.pageCount },
            (_, page) => `${pageDirectory}${page}.jpg`,
          );
          const pageInfo = await Promise.all(
            pageUris.map((pageUri) => FileSystem.getInfoAsync(pageUri)),
          );
          let completedPages = pageInfo.filter((info) => info.exists).length;
          let lastPersistedAt = 0;
          updateDownload(book.id, {
            downloadedPageCount: completedPages,
            progress: 0.1 + (completedPages / book.pageCount) * 0.9,
          });

          let nextPage = 0;
          const worker = async () => {
            while (nextPage < book.pageCount) {
              const page = nextPage;
              nextPage += 1;
              if (pageInfo[page].exists) continue;
              const pageUri = pageUris[page];
              const pageUrl = book.pageUrlTemplate.replace("{page}", String(page));
              await FileSystem.downloadAsync(pageUrl, pageUri);
              completedPages += 1;
              const now = Date.now();
              if (
                completedPages === book.pageCount ||
                completedPages % 4 === 0 ||
                now - lastPersistedAt > 500
              ) {
                lastPersistedAt = now;
                updateDownload(book.id, {
                  downloadedPageCount: completedPages,
                  progress: 0.1 + (completedPages / book.pageCount) * 0.9,
                });
              }
            }
          };
          await Promise.all(
            Array.from(
              { length: Math.min(4, book.pageCount) },
              () => worker(),
            ),
          );
          updateDownload(book.id, {
            downloadedPageCount: book.pageCount,
            progress: 1,
          });
        } else {
          updateDownload(book.id, {
            progress: 1,
            downloadedPageCount: 0,
          });
        }

        const finished: DownloadRecord = {
          status: "downloaded",
          progress: 1,
          localPdfUri: pdf.uri,
          localCoverUri: cover.uri,
          localPageDirectory: pageDirectory,
          downloadedPageCount: pageDirectory ? book.pageCount : 0,
        };
        updateDownload(book.id, finished);
      } catch (error) {
        const currentRecord = snapshot.downloads[book.id];
        updateDownload(book.id, {
          status: "error",
          progress: currentRecord?.progress ?? 0,
          error: error instanceof Error ? error.message : "تعذر تنزيل الكتاب",
        });
      }
    },
    [snapshot.downloads, updateDownload],
  );

  const deleteDownload = useCallback(
    async (bookId: string) => {
      const record = snapshot.downloads[bookId];
      if (record?.localPdfUri) {
        await FileSystem.deleteAsync(record.localPdfUri, {
          idempotent: true,
        }).catch(() => undefined);
      }
      if (record?.localCoverUri) {
        await FileSystem.deleteAsync(record.localCoverUri, {
          idempotent: true,
        }).catch(() => undefined);
      }
      if (record?.localPageDirectory) {
        await FileSystem.deleteAsync(record.localPageDirectory, {
          idempotent: true,
        }).catch(() => undefined);
      }
      const downloads = { ...snapshot.downloads };
      delete downloads[bookId];
      persist({ ...snapshot, downloads });
    },
    [persist, snapshot],
  );

  const toggleFavorite = useCallback(
    async (bookId: string) => {
      if (!isSignedIn) throw new Error("سجّل الدخول لحفظ الكتب في حسابك");
      const active = favoriteBookIds[bookId] === true;
      await apiFetch(`/api/me/favorites/${encodeURIComponent(bookId)}`, {
        method: active ? "DELETE" : "PUT",
        body: "{}",
      });
      setFavoriteBookIds((current) => {
        const next = { ...current };
        if (active) delete next[bookId];
        else next[bookId] = true;
        return next;
      });
    },
    [favoriteBookIds, isSignedIn],
  );

  const toggleSavedBook = useCallback(
    async (bookId: string) => {
      if (!isSignedIn) throw new Error("سجّل الدخول لحفظ الكتب في حسابك");
      const active = savedBookIds[bookId] === true;
      await apiFetch(`/api/me/saved-books/${encodeURIComponent(bookId)}`, {
        method: active ? "DELETE" : "PUT",
        body: "{}",
      });
      setSavedBookIds((current) => {
        const next = { ...current };
        if (active) delete next[bookId];
        else next[bookId] = true;
        return next;
      });
    },
    [isSignedIn, savedBookIds],
  );

  const value = useMemo(
    () => ({
      ...snapshot,
      ready,
      preferencesReady,
      favoriteBookIds,
      savedBookIds,
      setProgress,
      downloadBook,
      deleteDownload,
      toggleFavorite,
      toggleSavedBook,
    }),
    [
      deleteDownload,
      downloadBook,
      favoriteBookIds,
      preferencesReady,
      ready,
      savedBookIds,
      setProgress,
      snapshot,
      toggleFavorite,
      toggleSavedBook,
    ],
  );

  return <LibraryCtx.Provider value={value}>{children}</LibraryCtx.Provider>;
}

export function useLibrary() {
  const context = useContext(LibraryCtx);
  if (!context) {
    throw new Error("useLibrary must be used within LibraryProvider");
  }
  return context;
}
