import { NextRequest, NextResponse } from "next/server";

/* ─── types ─── */
interface SubDLResult {
  release_name: string;
  name: string;
  lang: string;
  author: string;
  url: string;
  subtitlePage: string;
  season: number;
  episode: number | null;
  language: string;
  hi: boolean;
  full_season: boolean;
}

interface SubSourceResult {
  id: number;
  title: string;
  language: string;
  release: string;
  author: string;
  downloadCount: number;
  rating: number;
}

export interface NormalizedSub {
  id: string;
  source: "subdl" | "subsource";
  releaseName: string;
  language: string;
  languageCode: string;
  author: string;
  downloadUrl: string;
  pageUrl: string;
  hi: boolean;
  rating: number | null;
  downloads: number | null;
  episode: number | null;
  season: number | null;
}

/* ─── helpers ─── */
const LANG_MAP: Record<string, string> = {
  vi: "vietnamese",
  en: "english",
  ko: "korean",
  ja: "japanese",
  zh: "chinese",
  fr: "french",
  de: "german",
  es: "spanish",
  pt: "portuguese",
  it: "italian",
  th: "thai",
  id: "indonesian",
};

const SUBDL_LANG_MAP: Record<string, string> = {
  vi: "VI",
  en: "EN",
  ko: "KO",
  ja: "JA",
  zh: "ZH",
  fr: "FR",
  de: "DE",
  es: "ES",
  pt: "PT",
  it: "IT",
  th: "TH",
  id: "ID",
};

async function searchSubDL(
  query: string,
  lang: string,
  type: string
): Promise<NormalizedSub[]> {
  const apiKey = process.env.SUBDL_API_KEY;
  if (!apiKey) return [];

  try {
    const params = new URLSearchParams({
      api_key: apiKey,
      film_name: query,
      languages: SUBDL_LANG_MAP[lang] || "VI",
      subs_per_page: "30",
    });
    if (type === "movie") params.set("type", "movie");
    if (type === "episode") params.set("type", "tv");

    const res = await fetch(
      `https://api.subdl.com/api/v1/subtitles?${params}`,
      { next: { revalidate: 0 } }
    );
    if (!res.ok) return [];

    const data = await res.json();
    const subtitles: SubDLResult[] = data.subtitles || [];
    const movieInfo = data.results?.[0];

    return subtitles.map((s, i) => ({
      id: `subdl-${i}-${Date.now()}`,
      source: "subdl" as const,
      releaseName: s.release_name || s.name,
      language: LANG_MAP[lang] || s.lang || "vietnamese",
      languageCode: lang,
      author: s.author || "Unknown",
      downloadUrl: s.url.startsWith("/")
        ? s.url.split("?")[0]
        : s.url.split("?")[0],
      pageUrl: s.subtitlePage
        ? `https://subdl.com${s.subtitlePage}`
        : `https://subdl.com`,
      hi: s.hi || false,
      rating: null,
      downloads: null,
      episode: s.episode,
      season: s.season || null,
    }));
  } catch (e) {
    console.error("SubDL error:", e);
    return [];
  }
}

async function searchSubSource(
  query: string,
  lang: string,
  type: string
): Promise<NormalizedSub[]> {
  const apiKey = process.env.SUBSOURCE_API_KEY;
  if (!apiKey) return [];

  try {
    // Step 1: Search for the movie/show
    const searchRes = await fetch(
      `https://api.subsource.net/api/v1/movies/search?query=${encodeURIComponent(query)}`,
      {
        headers: { "X-API-Key": apiKey },
        next: { revalidate: 0 },
      }
    );
    if (!searchRes.ok) return [];

    const searchData = await searchRes.json();
    const movies = searchData?.data || searchData?.results || searchData || [];
    if (!Array.isArray(movies) || movies.length === 0) return [];

    const movieId = movies[0]?.id;
    if (!movieId) return [];

    // Step 2: Get subtitles for that movie
    const subsRes = await fetch(
      `https://api.subsource.net/api/v1/subtitles?movieId=${movieId}&language=${LANG_MAP[lang] || "vietnamese"}`,
      {
        headers: { "X-API-Key": apiKey },
        next: { revalidate: 0 },
      }
    );
    if (!subsRes.ok) return [];

    const subsData = await subsRes.json();
    const subs: SubSourceResult[] =
      subsData?.data || subsData?.results || subsData || [];
    if (!Array.isArray(subs)) return [];

    return subs.map((s, i) => ({
      id: `subsource-${s.id || i}-${Date.now()}`,
      source: "subsource" as const,
      releaseName: s.release || s.title || "Unknown",
      language: LANG_MAP[lang] || "vietnamese",
      languageCode: lang,
      author: s.author || "Unknown",
      downloadUrl: `https://api.subsource.net/api/v1/subtitles/${s.id}/download`,
      pageUrl: `https://subsource.net`,
      hi: false,
      rating: s.rating || null,
      downloads: s.downloadCount || null,
      episode: null,
      season: null,
    }));
  } catch (e) {
    console.error("SubSource error:", e);
    return [];
  }
}

/* ─── route handler ─── */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q")?.trim();
  const lang = searchParams.get("lang") || "vi";
  const type = searchParams.get("type") || "all";

  if (!query) {
    return NextResponse.json(
      { error: "Missing query parameter 'q'" },
      { status: 400 }
    );
  }

  // Search both sources in parallel
  const [subdlResults, subsourceResults] = await Promise.all([
    searchSubDL(query, lang, type),
    searchSubSource(query, lang, type),
  ]);

  const allResults = [...subdlResults, ...subsourceResults];

  return NextResponse.json({
    query,
    language: lang,
    type,
    total: allResults.length,
    sources: {
      subdl: subdlResults.length,
      subsource: subsourceResults.length,
    },
    subtitles: allResults,
  });
}
