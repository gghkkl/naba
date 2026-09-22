const ARABIC_MARKS =
  /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640\u200E\u200F\u202A-\u202E]/g;

function normalizeLetters(value: string) {
  return value
    .normalize("NFKC")
    .replace(ARABIC_MARKS, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ى/g, "ي")
    .replace(/[ةه]/g, "ه")
    .replace(/[ظض]/g, "ض")
    .replace(/[گک]/g, "ك")
    .replace(/پ/g, "ب")
    .replace(/چ/g, "ج")
    .replace(/ڤ/g, "ف")
    .toLowerCase();
}

function normalizeToken(token: string) {
  const normalized = normalizeLetters(token);
  // Make the definite article optional only at a word boundary. Keep Allah
  // intact so removing "ال" never turns it into an unrelated short match.
  if (
    normalized.length > 3 &&
    normalized.startsWith("ال") &&
    normalized !== "الله" &&
    !normalized.startsWith("اللهم")
  ) {
    return normalized.slice(2);
  }
  return normalized;
}

export function normalizeForSearch(value: string) {
  return normalizeLetters(value)
    .split(/\s+/)
    .map(normalizeToken)
    .join(" ")
    .trim();
}

export function countSearchMatches(text: string, query: string) {
  if (!query) return 0;
  let count = 0;
  let cursor = text.indexOf(query);
  while (cursor >= 0) {
    count += 1;
    cursor = text.indexOf(query, cursor + Math.max(1, query.length));
  }
  return count;
}