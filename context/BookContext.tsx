import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import {
  ALL_TABLE_OF_CONTENTS,
  getBookPart,
  BookPart,
} from "@/constants/tableOfContents";
import {
  countSearchMatches,
  normalizeForSearch,
} from "@/utils/searchNormalization";

const SEARCH_INDEX = require("../assets/search-index.json") as {
  pages: string[];
};

function normalizeArabic(value: string) {
  return normalizeForSearch(value);
}

const NORMALIZED_SEARCH_PAGES = SEARCH_INDEX.pages.map(normalizeArabic);

const SECTION_BY_PAGE: string[] = [];
let tocIndex = 0;
let activeSection = "";
for (let page = 1; page <= SEARCH_INDEX.pages.length; page += 1) {
  while (
    tocIndex < ALL_TABLE_OF_CONTENTS.length &&
    ALL_TABLE_OF_CONTENTS[tocIndex].page <= page
  ) {
    activeSection = ALL_TABLE_OF_CONTENTS[tocIndex].title;
    tocIndex += 1;
  }
  SECTION_BY_PAGE[page - 1] = activeSection;
}

function searchBookChunk(
  rawQuery: string,
  normalizedQuery: string,
  startIndex: number,
  endIndex: number,
): SearchResult[] {
  const results: SearchResult[] = [];
  const trimmedQuery = rawQuery.trim();

  for (let index = startIndex; index < endIndex; index += 1) {
    const text = SEARCH_INDEX.pages[index] || "";
    const searchableText = NORMALIZED_SEARCH_PAGES[index] || "";
    const count = countSearchMatches(searchableText, normalizedQuery);
    if (count === 0) continue;

    const originalIndex = Math.max(0, text.indexOf(trimmedQuery));
    const excerptStart = Math.max(0, originalIndex - 70);
    results.push({
      page: index + 1,
      part: getBookPart(index + 1),
      count,
      excerpt: text.slice(excerptStart, excerptStart + 170),
      section: SECTION_BY_PAGE[index] || "",
    });
  }

  return results;
}

export interface SearchResult {
  page: number;
  part: BookPart;
  count: number;
  excerpt: string;
  section: string;
}

export interface TocEntry {
  title: string;
  page: number;
}

interface BookContextType {
  currentPage: number;
  totalPages: number;
  bookReady: boolean;
  isSearching: boolean;
  searchProgress: { completed: number; total: number };
  searchError: string | null;
  searchQuery: string;
  searchResults: SearchResult[];
  fromSearch: boolean;
  fromContents: boolean;
  searchResultIndex: number;
  searchHighlight: string;
  searchScrollPos: number;

  setCurrentPage: (n: number) => void;
  setTotalPages: (n: number) => void;
  setBookReady: (b: boolean) => void;
  setIsSearching: (b: boolean) => void;
  setSearchProgress: (progress: { completed: number; total: number }) => void;
  setSearchError: (message: string | null) => void;
  setSearchResults: (r: SearchResult[]) => void;
  setFromSearch: (b: boolean) => void;
  setFromContents: (b: boolean) => void;
  setSearchResultIndex: (n: number) => void;
  setSearchScrollPos: (n: number) => void;

  jumpToPage: (page: number) => void;
  startSearch: (query: string) => void;
  highlightInBook: (page: number, text: string) => void;
  sendTocToViewer: (toc: TocEntry[]) => void;
  registerViewer: (send: (msg: object) => void) => () => void;
  saveSearchState: (
    query: string,
    results: SearchResult[],
    highlight: string,
    scrollPos: number,
    resultIndex: number
  ) => void;
}

const BookCtx = createContext<BookContextType | null>(null);

export function BookProvider({ children }: { children: React.ReactNode }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [bookReady, setBookReady] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState({ completed: 0, total: 0 });
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResultsState] = useState<SearchResult[]>([]);
  const [fromSearch, setFromSearch] = useState(false);
  const [fromContents, setFromContents] = useState(false);
  const [searchResultIndex, setSearchResultIndex] = useState(-1);
  const [searchHighlight, setSearchHighlight] = useState("");
  const [searchScrollPos, setSearchScrollPos] = useState(0);

  const sendFn = useRef<((msg: object) => void) | null>(null);
  const searchRunRef = useRef(0);

  const registerViewer = useCallback((send: (msg: object) => void) => {
    sendFn.current = send;
    return () => {
      if (sendFn.current === send) {
        sendFn.current = null;
      }
    };
  }, []);

  const jumpToPage = useCallback((page: number) => {
    setCurrentPage(page);
    sendFn.current?.({ type: "goto", page });
  }, []);

  const startSearch = useCallback((query: string) => {
    const runId = searchRunRef.current + 1;
    searchRunRef.current = runId;
    const trimmedQuery = query.trim();
    const normalizedQuery = normalizeArabic(trimmedQuery);
    const total = SEARCH_INDEX.pages.length;
    const chunkSize = 32;

    setSearchQuery(query);
    setSearchError(null);
    setSearchResultsState([]);
    setIsSearching(true);
    setSearchProgress({ completed: 0, total });

    if (!normalizedQuery) {
      setIsSearching(false);
      return;
    }

    const processChunk = (startIndex: number, accumulated: SearchResult[]) => {
      if (runId !== searchRunRef.current) return;

      try {
        const endIndex = Math.min(total, startIndex + chunkSize);
        const nextResults = [
          ...accumulated,
          ...searchBookChunk(trimmedQuery, normalizedQuery, startIndex, endIndex),
        ];
        setSearchResultsState(nextResults);
        setSearchProgress({ completed: endIndex, total });

        if (endIndex < total) {
          setTimeout(() => processChunk(endIndex, nextResults), 0);
        } else {
          setIsSearching(false);
        }
      } catch (error) {
        setSearchError(
          error instanceof Error ? error.message : "تعذر البحث في الكتاب",
        );
        setIsSearching(false);
      }
    };

    setTimeout(() => processChunk(0, []), 0);
  }, []);

  const highlightInBook = useCallback((page: number, text: string) => {
    sendFn.current?.({ type: "highlight", page, text });
  }, []);

  const sendTocToViewer = useCallback((toc: TocEntry[]) => {
    sendFn.current?.({ type: "setToc", data: toc });
  }, []);

  const setSearchResults = useCallback((r: SearchResult[]) => {
    setSearchResultsState(r);
    setIsSearching(false);
    setSearchProgress((current) =>
      current.total ? { completed: current.total, total: current.total } : current,
    );
    setSearchError(null);
  }, []);

  const saveSearchState = useCallback(
    (
      query: string,
      results: SearchResult[],
      highlight: string,
      scrollPos: number,
      resultIndex: number
    ) => {
      setSearchQuery(query);
      setSearchResultsState(results);
      setSearchHighlight(highlight);
      setSearchScrollPos(scrollPos);
      setFromSearch(true);
      setFromContents(false);
      setSearchResultIndex(resultIndex);
    },
    []
  );

  return (
    <BookCtx.Provider
      value={{
        currentPage,
        totalPages,
        bookReady,
        isSearching,
        searchProgress,
        searchError,
        searchQuery,
        searchResults,
        fromSearch,
        fromContents,
        searchResultIndex,
        searchHighlight,
        searchScrollPos,
        setCurrentPage,
        setTotalPages,
        setBookReady,
        setIsSearching,
        setSearchProgress,
        setSearchError,
        setSearchResults,
        setFromSearch,
        setFromContents,
        setSearchResultIndex,
        setSearchScrollPos,
        jumpToPage,
        startSearch,
        highlightInBook,
        sendTocToViewer,
        registerViewer,
        saveSearchState,
      }}
    >
      {children}
    </BookCtx.Provider>
  );
}

export function useBook() {
  const ctx = useContext(BookCtx);
  if (!ctx) throw new Error("useBook must be within BookProvider");
  return ctx;
}
