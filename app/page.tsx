"use client";

import { useState, FormEvent } from "react";

/* ─── types ─── */
interface Subtitle {
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

interface SearchResponse {
  query: string;
  total: number;
  sources: { subdl: number; subsource: number };
  subtitles: Subtitle[];
}

/* ─── language labels ─── */
const LANG_LABELS: Record<string, string> = {
  vi: "Tiếng Việt",
  en: "English",
  ko: "한국어",
  ja: "日本語",
  zh: "中文",
  fr: "Français",
  de: "Deutsch",
  es: "Español",
  th: "ภาษาไทย",
  id: "Bahasa Indonesia",
};

export default function Home() {
  const [query, setQuery] = useState("");
  const [lang, setLang] = useState("vi");
  const [type, setType] = useState("all");
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError("");
    setSearched(true);

    try {
      const params = new URLSearchParams({
        q: query.trim(),
        lang,
        type,
      });
      const res = await fetch(`/api/search?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: SearchResponse = await res.json();
      setResults(data);
    } catch (err) {
      console.error(err);
      setError("Không thể tìm kiếm. Vui lòng thử lại.");
      setResults(null);
    } finally {
      setLoading(false);
    }
  }

  function handleDownload(sub: Subtitle) {
    const params = new URLSearchParams({
      url: sub.downloadUrl,
      source: sub.source,
    });
    window.open(`/api/download?${params}`, "_blank");
  }

  return (
    <main>
      {/* ════════ HERO ════════ */}
      <section className="hero">
        <nav>
          <span className="brand">
            <i>⌁</i> SUBFIND
          </span>
          <span className="pill">Bản beta · SubDL + SubSource</span>
        </nav>

        <div className="hero-copy">
          <p className="eyebrow">SUBTITLE DISCOVERY</p>
          <h1>
            Tìm phụ đề
            <br />
            <em>đúng bản phát hành.</em>
          </h1>
          <p className="lede">
            Một nơi để tìm, so sánh và tải phụ đề từ SubDL và SubSource — hai
            nguồn phụ đề lớn nhất thế giới.
          </p>
        </div>

        <form className="search-panel" onSubmit={handleSearch}>
          <label htmlFor="title">Tên phim hoặc series</label>
          <div className="search-row">
            <input
              id="title"
              placeholder="Ví dụ: Dune Part Two"
              autoComplete="off"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="submit" disabled={loading || !query.trim()}>
              {loading ? "Đang tìm..." : "Tìm phụ đề"}
            </button>
          </div>
          <div className="filters">
            <label>
              Ngôn ngữ
              <select value={lang} onChange={(e) => setLang(e.target.value)}>
                <option value="vi">Tiếng Việt</option>
                <option value="en">English</option>
                <option value="ko">한국어</option>
                <option value="ja">日本語</option>
                <option value="zh">中文</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
                <option value="es">Español</option>
                <option value="th">ภาษาไทย</option>
                <option value="id">Bahasa Indonesia</option>
              </select>
            </label>
            <label>
              Loại nội dung
              <select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="all">Phim &amp; Series</option>
                <option value="movie">Phim</option>
                <option value="episode">Tập phim</option>
              </select>
            </label>
            <span className="hint">SRT · VTT · ASS</span>
          </div>
        </form>
      </section>

      {/* ════════ RESULTS ════════ */}
      <section className="content">
        <div className="section-head">
          <div>
            <p className="eyebrow">KẾT QUẢ</p>
            <h2>
              {!searched
                ? "Sẵn sàng để tìm"
                : loading
                  ? "Đang tìm kiếm..."
                  : results
                    ? `${results.total} phụ đề tìm thấy`
                    : "Không có kết quả"}
            </h2>
          </div>
          <span className="legal">
            Chỉ tải nội dung bạn có quyền sử dụng.
          </span>
        </div>

        {/* stats */}
        {results && results.total > 0 && (
          <div className="stats-bar">
            <span className="stat-chip total">
              <span className="dot" /> Tổng: {results.total}
            </span>
            {results.sources.subdl > 0 && (
              <span className="stat-chip subdl">
                <span className="dot" /> SubDL: {results.sources.subdl}
              </span>
            )}
            {results.sources.subsource > 0 && (
              <span className="stat-chip subsource">
                <span className="dot" /> SubSource: {results.sources.subsource}
              </span>
            )}
          </div>
        )}

        {/* empty */}
        {!searched && !loading && (
          <div className="empty">
            <span>⌕</span>
            <p>
              Nhập tên phim để bắt đầu. Kết quả sẽ hiện kèm ngôn ngữ, bản
              phát hành và nguồn cung cấp.
            </p>
          </div>
        )}

        {/* loading */}
        {loading && (
          <div className="loading-state">
            <div className="loading-spinner" />
            <p>Đang truy vấn SubDL và SubSource...</p>
          </div>
        )}

        {/* error */}
        {error && (
          <div className="error-state">
            <span>⚠</span>
            <p>{error}</p>
          </div>
        )}

        {/* results */}
        {!loading && results && results.total > 0 && (
          <div className="result-list">
            {results.subtitles.map((sub) => (
              <div key={sub.id} className="result-card">
                <div className="result-info">
                  <div className="result-release">{sub.releaseName}</div>
                  <div className="result-meta">
                    <span className={`source-badge ${sub.source}`}>
                      {sub.source === "subdl" ? "SubDL" : "SubSource"}
                    </span>
                    <span>👤 {sub.author}</span>
                    <span>🌐 {LANG_LABELS[sub.languageCode] || sub.language}</span>
                    {sub.hi && <span className="hi-badge">HI</span>}
                    {sub.season != null && sub.season > 0 && (
                      <span>📺 S{sub.season}</span>
                    )}
                    {sub.episode != null && <span>E{sub.episode}</span>}
                    {sub.downloads != null && (
                      <span>⬇ {sub.downloads.toLocaleString()}</span>
                    )}
                    {sub.rating != null && sub.rating > 0 && (
                      <span>⭐ {sub.rating.toFixed(1)}</span>
                    )}
                  </div>
                </div>
                <div className="result-actions">
                  <button
                    className="btn-download"
                    onClick={() => handleDownload(sub)}
                    title="Tải phụ đề"
                  >
                    ⬇ Tải
                  </button>
                  <a
                    className="btn-page"
                    href={sub.pageUrl}
                    target="_blank"
                    rel="noreferrer"
                    title="Mở trang gốc"
                  >
                    ↗
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* no results after search */}
        {!loading && searched && results && results.total === 0 && (
          <div className="empty">
            <span>🔍</span>
            <p>
              Không tìm thấy phụ đề cho &ldquo;{results.query}&rdquo; bằng{" "}
              {LANG_LABELS[lang]}. Thử tìm bằng tên tiếng Anh hoặc đổi ngôn
              ngữ.
            </p>
          </div>
        )}

        {/* direct search links */}
        <div className="sources">
          <p>Không thấy kết quả? Mở tìm kiếm trực tiếp trên nguồn:</p>
          <div>
            <a
              href={`https://subdl.com/search?query=${encodeURIComponent(query)}`}
              target="_blank"
              rel="noreferrer"
            >
              SubDL <span>↗</span>
            </a>
            <a
              href={`https://subsource.net/search/${encodeURIComponent(query)}`}
              target="_blank"
              rel="noreferrer"
            >
              SubSource <span>↗</span>
            </a>
            <a
              href={`https://www.opensubtitles.com/en/search/all/q/${encodeURIComponent(query)}`}
              target="_blank"
              rel="noreferrer"
            >
              OpenSubtitles <span>↗</span>
            </a>
            <a
              href={`https://www.podnapisi.net/subtitles/search/old?keywords=${encodeURIComponent(query)}`}
              target="_blank"
              rel="noreferrer"
            >
              Podnapisi <span>↗</span>
            </a>
          </div>
        </div>
      </section>

      {/* ════════ FOOTER ════════ */}
      <footer>
        <span>SUBFIND / 2026</span>
        <span>Không lưu trữ hoặc phân phối tệp phụ đề.</span>
        <span>Powered by SubDL API &amp; SubSource API.</span>
      </footer>
    </main>
  );
}
