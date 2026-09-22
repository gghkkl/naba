import { FATA23_PAGE_IMAGES } from "@/assets/fata23PageAssets";

export type LibraryBook = {
  id: string;
  title: string;
  author: string;
  description: string;
  releaseDate: string;
  publisher: string;
  status: string;
  originalLanguage: string;
  translation: string;
  coverUrl: string;
  coverAsset?: number;
  pdfUrl: string;
  pageUrlTemplate: string;
  pageCount: number;
  pageAssets?: readonly number[];
};

export const NABA_BOOK: LibraryBook = {
  id: "salam-ibrahim",
  title: "سلامٌ على إبراهيم",
  author: "إعداد مجموعة الشهيد إبراهيم هادي الثقافية",
  description:
    "سيرة مؤثرة توثّق حياة الشهيد إبراهيم هادي، من طفولته ونشأته ورياضته إلى مسيرته في الثورة والدفاع المقدس، من خلال ذكريات عائلته وأصدقائه ورفاقه. كتاب يرسم صورة رجل جمع بين الشجاعة والتواضع والإخلاص وخدمة الآخرين، ويقدّم مواقفه وقصصه بوصفها تجربة إنسانية وإيمانية ملهمة.",
  releaseDate: "2017م – 1438هـ، الطبعة الأولى",
  publisher: "دار المعارف الإسلامية الثقافية",
  status: "مترجم",
  originalLanguage: "الفارسية",
  translation: "مركز المعارف للترجمة",
  coverUrl:
    "https://ia800701.us.archive.org/BookReader/BookReaderImages.php?id=20260921_20260921_0225&itemPath=%2F1%2Fitems%2F20260921_20260921_0225&server=ia800701.us.archive.org&page=n0.jpg",
  coverAsset: require("../assets/images/salam-ibrahim-cover.jpg"),
  pdfUrl:
    "https://archive.org/download/20260921_20260921_0225/%D8%B3%D9%84%D8%A7%D9%85%20%D8%B9%D9%84%D9%89%20%D8%A7%CC%95%D8%A8%D8%B1%D8%A7%D9%87%D9%8A%D9%85.pdf",
  pageUrlTemplate:
    "https://ia800701.us.archive.org/BookReader/BookReaderImages.php?id=20260921_20260921_0225&itemPath=%2F1%2Fitems%2F20260921_20260921_0225&server=ia800701.us.archive.org&page=n{page}.jpg",
  pageCount: 304,
};

export const FATA23_BOOK: LibraryBook = {
  id: "olaaek-al-thalatha-wal-ishroon",
  title: "أولئك الثلاثة والعشرون فتىً",
  author: "أحمد يوسف زاده",
  description:
    "كتاب يروي تجربة ثلاثة وعشرين شابًا إيرانيًا خلال الحرب، وما مرّوا به من أحداث قاسية بعد وقوعهم في الأسر، متنقلين بين المعتقلات والسجون العراقية. يقدّم أحمد يوسف زاده الأحداث من خلال ذكرياته وتجربته الشخصية مع رفاقه، مستعرضًا تفاصيل الحياة في الجبهة، ثم الأسر، وما حملته تلك الفترة من مواقف إنسانية مؤثرة، وصعوبات وصمود وذكريات بقيت عالقة في الذاكرة. ويؤكد المؤلف أن ما يرويه قائم على أحداث عاشها وشاهدها بنفسه، مع الاستعانة بكتاباته السابقة ومقابلات مع أفراد المجموعة.",
  releaseDate: "2017م – 1438هـ",
  publisher: "دار المعارف الإسلامية الثقافية – بيروت",
  status: "مترجم",
  originalLanguage: "الفارسية",
  translation: "إيمان صالح، إعداد: مركز المعارف للترجمة",
  coverUrl:
    "https://ia600508.us.archive.org/14/items/images_20260921_2300/images.jpg",
  coverAsset: require("../assets/images/olaaek-cover.jpg"),
  pdfUrl:
    "https://ia600709.us.archive.org/34/items/pdf_fata23/pdf_fata23.pdf",
  pageUrlTemplate:
    "https://archive.org/download/pdf_fata23/pdf_fata23.pdf#page={page}",
  pageCount: 254,
  pageAssets: FATA23_PAGE_IMAGES,
};

export const LIBRARY_BOOKS: LibraryBook[] = [NABA_BOOK, FATA23_BOOK];

export function getLibraryBook(id: string) {
  return LIBRARY_BOOKS.find((book) => book.id === id) ?? null;
}

export function getBookCoverSource(book: LibraryBook, localCoverUri?: string) {
  return localCoverUri ? { uri: localCoverUri } : book.coverAsset ?? { uri: book.coverUrl };
}
