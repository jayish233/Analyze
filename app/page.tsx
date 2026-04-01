"use client";

import { useState, useEffect, useCallback } from "react";
import { getBaseUrl } from "@/lib/url";


interface Video {
  _id: string;
  videoId: string;
  title: string;
  channelName: string;
  thumbnail: string;
  views: number;
  viewsPerDay: number;
  channelAvgViewsPerDay: number;
  outperformRatio: number;
  isOutperforming: boolean;
  publishedDate: string;
  url: string;
  keyword: string;
  aiInsight?: string;
}

interface Keyword {
  _id: string;
  text: string;
  lastSearched?: string;
}

function formatNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toLocaleString();
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export default function Dashboard() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [total, setTotal] = useState(0);
  const [channels, setChannels] = useState<string[]>([]);
  const [dbKeywords, setDbKeywords] = useState<Keyword[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState({ outperforming: false, channel: "", keyword: "" });
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [insight, setInsight] = useState("");
  const [insightLoading, setInsightLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<string>("");
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [envError, setEnvError] = useState<string>("");

  // Keyword management state
  const [showKeywordManager, setShowKeywordManager] = useState(false);
  const [newKeyword, setNewKeyword] = useState("");
  const [isAddingKeyword, setIsAddingKeyword] = useState(false);

  useEffect(() => {
    // Check for NEXT_PUBLIC_APP_URL misconfiguration
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
    const isProduction = typeof window !== "undefined" && !window.location.hostname.includes("localhost");
    if (isProduction && (!appUrl || appUrl.includes("localhost"))) {
      setEnvError("Configuration Note: NEXT_PUBLIC_APP_URL is pointing to localhost. For reliable background scans and crons, please set this to your production URL in your hosting dashboard.");
    }
  }, []);

  const fetchKeywords = async () => {
    try {
      const res = await fetch("/api/keywords");
      const data = await res.json();
      setDbKeywords(data.keywords || []);
    } catch (e) {}
  };

  const fetchVideos = useCallback(async (p = 1) => {
    setLoading(true);
    const params = new URLSearchParams({
      page: p.toString(),
      limit: "18",
      ...(filter.outperforming && { outperforming: "true" }),
      ...(filter.channel && { channel: filter.channel }),
      ...(filter.keyword && { keyword: filter.keyword }),
    });
    try {
      const res = await fetch(`/api/videos?${params}`);
      const data = await res.json();
      setVideos(data.videos || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
      setChannels(data.channels || []);
      setLastUpdated(new Date().toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" }));
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchKeywords();
    fetchVideos(page);
  }, [page, fetchVideos]);

  const triggerSearch = async () => {
    setSearching(true);
    setSearchResult("");
    try {
      const res = await fetch("/api/search", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setSearchResult(`✅ Found ${data.totalFetched} videos · ${data.outperforming} outperforming · Saved ${data.saved}`);
        fetchVideos(1);
        fetchKeywords(); // refresh last searched time
      } else {
        setSearchResult(`❌ Error: ${data.error}`);
      }
    } finally {
      setSearching(false);
    }
  };

  const handleAddKeyword = async () => {
    if (!newKeyword.trim()) return;
    setIsAddingKeyword(true);
    try {
      const res = await fetch("/api/keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newKeyword.trim() }),
      });
      if (res.ok) {
        setNewKeyword("");
        fetchKeywords();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to add keyword");
      }
    } finally {
      setIsAddingKeyword(false);
    }
  };

  const handleDeleteKeyword = async (id: string) => {
    if (!confirm("Are you sure you want to stop tracking this keyword?")) return;
    try {
      const res = await fetch("/api/keywords", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        fetchKeywords();
      }
    } catch (e) {}
  };

  const getInsight = async (video: Video) => {
    setSelectedVideo(video);
    setInsight(video.aiInsight || "");
    if (video.aiInsight) return;
    setInsightLoading(true);
    try {
      const res = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId: video.videoId }),
      });
      const data = await res.json();
      setInsight(data.insight || "Could not generate insight.");
    } finally {
      setInsightLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#020617" }}>
      {/* Header */}
      <header style={{
        borderBottom: "1px solid #1e293b",
        background: "rgba(2,6,23,0.8)",
        backdropFilter: "blur(12px)",
        position: "sticky", top: 0, zIndex: 40,
        padding: "0 24px",
      }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#7c3aed,#38bdf8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📊</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 18, color: "#f1f5f9", letterSpacing: "-0.02em" }}>YT Intel</div>
              <div style={{ fontSize: 11, color: "#475569" }}>WebDev & AI Competitor Tracker</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {lastUpdated && <div style={{ fontSize: 12, color: "#475569" }}>Updated {lastUpdated}</div>}
            
            <button
              onClick={() => setShowKeywordManager(!showKeywordManager)}
              style={{ background: "#0f172a", border: "1px solid #1e293b", color: "#94a3b8", borderRadius: 8, padding: "8px 12px", fontSize: 13, cursor: "pointer", fontWeight: 600 }}
            >
              🏷️ Manage Keywords
            </button>

            <button
              onClick={triggerSearch}
              disabled={searching}
              className="btn-glow"
              style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}
            >
              {searching ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Analyzing…</> : "🔍 Scan Niche"}
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 24px" }}>
        
        {/* Environment Warning */}
        {envError && (
          <div className="fade-in" style={{
            background: "rgba(245,158,11,0.1)",
            border: "1px solid rgba(245,158,11,0.3)",
            borderRadius: 10, padding: "12px 16px", marginBottom: 24, fontSize: 13, color: "#f59e0b",
            display: "flex", alignItems: "center", gap: 10
          }}>
            <span>⚠️</span> {envError}
          </div>
        )}

        {/* Keyword Manager Modal/Section */}
        {showKeywordManager && (
          <div className="fade-in card" style={{ padding: 24, marginBottom: 32, background: "#0f172a", border: "1px solid #7c3aed33" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 18, color: "#f1f5f9", margin: 0 }}>Manage Tracking Keywords</h2>
                <p style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>Add specific niches or competitor topics to monitor on YouTube.</p>
              </div>
              <button onClick={() => setShowKeywordManager(false)} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 18 }}>✕</button>
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              <input
                type="text"
                placeholder="e.g. AI SaaS ideas, Cursor tutorial..."
                value={newKeyword}
                onChange={e => setNewKeyword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAddKeyword()}
                style={{ flex: 1, background: "#020617", border: "1px solid #1e293b", borderRadius: 10, padding: "12px 16px", color: "#f1f5f9", fontSize: 14 }}
              />
              <button
                onClick={handleAddKeyword}
                disabled={isAddingKeyword || !newKeyword.trim()}
                className="btn-glow"
                style={{ padding: "10px 24px", fontSize: 14 }}
              >
                {isAddingKeyword ? "Adding..." : "Add"}
              </button>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {dbKeywords.map(kw => (
                <div key={kw._id} style={{ background: "#020617", border: "1px solid #1e293b", borderRadius: 12, padding: "8px 12px", display: "flex", alignItems: "center", gap: 8 }}>
                  <div>
                    <div style={{ color: "#cbd5e1", fontSize: 13, fontWeight: 600 }}>{kw.text}</div>
                    {kw.lastSearched && <div style={{ color: "#475569", fontSize: 10 }}>Last scan: {timeAgo(kw.lastSearched)}</div>}
                  </div>
                  <button
                    onClick={() => handleDeleteKeyword(kw._id)}
                    style={{ background: "#1e293b", border: "none", borderRadius: 4, width: 22, height: 22, color: "#ef4444", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search result banner */}
        {searchResult && (
          <div className="fade-in" style={{
            background: searchResult.startsWith("✅") ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)",
            border: `1px solid ${searchResult.startsWith("✅") ? "rgba(52,211,153,0.3)" : "rgba(248,113,113,0.3)"}`,
            borderRadius: 10, padding: "12px 16px", marginBottom: 24, fontSize: 14, color: "#e2e8f0",
          }}>
            {searchResult}
          </div>
        )}

        {/* Stats cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 32 }}>
          {[
            { label: "Total Videos", value: total, color: "#38bdf8", icon: "🎬" },
            { label: "Outperforming", value: videos.filter(v => v.isOutperforming).length, color: "#34d399", icon: "🔥" },
            { label: "Channels Tracked", value: channels.length, color: "#a78bfa", icon: "📺" },
            { label: "Niches Tracked", value: dbKeywords.length, color: "#f59e0b", icon: "🔎" },
          ].map((stat) => (
            <div key={stat.label} className="card" style={{ padding: 20 }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{stat.icon}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: stat.color }}>{stat.value.toLocaleString()}</div>
              <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}>
          <button
            onClick={() => { setFilter(f => ({ ...f, outperforming: !f.outperforming })); setPage(1); }}
            style={{
              background: filter.outperforming ? "rgba(124,58,237,0.2)" : "#0f172a",
              border: `1px solid ${filter.outperforming ? "#7c3aed" : "#1e293b"}`,
              color: filter.outperforming ? "#a78bfa" : "#64748b",
              borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 13, fontWeight: 600,
            }}
          >
            🔥 Outperforming Only
          </button>

          <select
            value={filter.keyword}
            onChange={e => { setFilter(f => ({ ...f, keyword: e.target.value })); setPage(1); }}
            style={{ background: "#0f172a", border: "1px solid #1e293b", color: "#94a3b8", borderRadius: 8, padding: "8px 12px", fontSize: 13, cursor: "pointer" }}
          >
            <option value="">All Topics</option>
            {dbKeywords.map(k => <option key={k._id} value={k.text}>{k.text}</option>)}
          </select>

          <select
            value={filter.channel}
            onChange={e => { setFilter(f => ({ ...f, channel: e.target.value })); setPage(1); }}
            style={{ background: "#0f172a", border: "1px solid #1e293b", color: "#94a3b8", borderRadius: 8, padding: "8px 12px", fontSize: 13, cursor: "pointer" }}
          >
            <option value="">All Channels</option>
            {channels.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {(filter.outperforming || filter.channel || filter.keyword) && (
            <button
              onClick={() => { setFilter({ outperforming: false, channel: "", keyword: "" }); setPage(1); }}
              style={{ background: "transparent", border: "none", color: "#64748b", cursor: "pointer", fontSize: 13 }}
            >
              ✕ Clear filters
            </button>
          )}
        </div>

        {/* Video grid */}
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
            <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
          </div>
        ) : videos.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
            <div style={{ color: "#f1f5f9", fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No results in dashboard</div>
            <p style={{ color: "#64748b", fontSize: 14, maxWidth: 500, margin: "0 auto 24px auto", lineHeight: 1.6 }}>
              This usually happens if the database is empty. You need to run a manual scan to fetch the latest videos from YouTube.
            </p>
            
            <div style={{ display: "flex", justifyContent: "center", gap: 16, marginBottom: 32 }}>
              <button onClick={triggerSearch} disabled={searching} className="btn-glow">
                {searching ? "Scanning..." : "🚀 Run Initial Scan"}
              </button>
            </div>

            <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 20, maxWidth: 600, margin: "0 auto", textAlign: "left" }}>
              <div style={{ color: "#94a3b8", fontSize: 13, fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <span>🛠️</span> Troubleshooting Tips
              </div>
              <ul style={{ color: "#64748b", fontSize: 13, margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                <li>Confirm <b>SCRAPINGDOG_API_KEY</b> is correctly set in your Vercel/Production settings.</li>
                <li>Ensure <b>MONGODB_URI</b> is pointing to the correct database clusters.</li>
                <li>Check your ScrappingDog dashboard for usage limits or API errors.</li>
                <li>If the scan times out, try adding fewer keywords in the "Manage Keywords" section.</li>
              </ul>
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 20 }}>
            {videos.map((video, i) => (
              <div
                key={video._id}
                className="card fade-in"
                style={{ padding: 0, overflow: "hidden", cursor: "pointer", animationDelay: `${i * 0.04}s` }}
                onClick={() => getInsight(video)}
              >
                {/* Thumbnail */}
                <div style={{ position: "relative", aspectRatio: "16/9", background: "#1e293b" }}>
                  {video.thumbnail ? (
                    <img src={video.thumbnail} alt={video.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#334155", fontSize: 32 }}>▶</div>
                  )}
                  <div style={{ position: "absolute", top: 10, right: 10 }}>
                    <span className={`badge ${video.isOutperforming ? "badge-outperform pulse" : "badge-normal"}`}>
                      {video.isOutperforming ? `🔥 ${video.outperformRatio}x` : `${video.outperformRatio}x`}
                    </span>
                  </div>
                  {video.keyword && (
                    <div style={{ position: "absolute", bottom: 10, left: 10 }}>
                      <span style={{ background: "rgba(2,6,23,0.85)", color: "#64748b", borderRadius: 6, padding: "2px 8px", fontSize: 11 }}>
                        {video.keyword}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div style={{ padding: 16 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#f1f5f9", lineHeight: 1.4, marginBottom: 8, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {video.title}
                  </div>
                  <div style={{ color: "#64748b", fontSize: 12, marginBottom: 12 }}>
                    📺 {video.channelName} · {timeAgo(video.publishedDate)}
                  </div>

                  {/* Metrics */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                    <div style={{ background: "#0f172a", borderRadius: 8, padding: "10px 12px" }}>
                      <div style={{ color: "#38bdf8", fontWeight: 700, fontSize: 16 }}>{formatNum(video.viewsPerDay)}<span style={{ fontSize: 11, color: "#475569" }}>/day</span></div>
                      <div style={{ color: "#475569", fontSize: 11 }}>Views/Day</div>
                    </div>
                    <div style={{ background: "#0f172a", borderRadius: 8, padding: "10px 12px" }}>
                      <div style={{ color: "#94a3b8", fontWeight: 700, fontSize: 16 }}>{formatNum(video.channelAvgViewsPerDay)}<span style={{ fontSize: 11, color: "#475569" }}>/day</span></div>
                      <div style={{ color: "#475569", fontSize: 11 }}>Channel Avg</div>
                    </div>
                  </div>

                  {/* Score bar */}
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: "#475569" }}>Outperform ratio</span>
                      <span style={{ fontSize: 11, color: "#7c3aed", fontWeight: 700 }}>{video.outperformRatio}x</span>
                    </div>
                    <div className="score-bar-bg">
                      <div className="score-bar-fill" style={{ width: `${Math.min(100, (video.outperformRatio / 5) * 100)}%` }} />
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <a
                      href={video.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      style={{ flex: 1, textAlign: "center", background: "#1e293b", color: "#94a3b8", borderRadius: 8, padding: "8px", fontSize: 12, textDecoration: "none", fontWeight: 600 }}
                    >
                      ▶ Watch
                    </a>
                    <button
                      onClick={e => { e.stopPropagation(); getInsight(video); }}
                      style={{ flex: 1, background: "rgba(124,58,237,0.1)", color: "#a78bfa", border: "1px solid rgba(124,58,237,0.2)", borderRadius: 8, padding: "8px", fontSize: 12, cursor: "pointer", fontWeight: 600 }}
                    >
                      🤖 AI Insight
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 32 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              style={{ background: "#0f172a", border: "1px solid #1e293b", color: page === 1 ? "#334155" : "#94a3b8", borderRadius: 8, padding: "8px 16px", cursor: page === 1 ? "not-allowed" : "pointer" }}>
              ← Prev
            </button>
            <span style={{ display: "flex", alignItems: "center", color: "#64748b", fontSize: 14 }}>
              Page {page} of {totalPages}
            </span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              style={{ background: "#0f172a", border: "1px solid #1e293b", color: page === totalPages ? "#334155" : "#94a3b8", borderRadius: 8, padding: "8px 16px", cursor: page === totalPages ? "not-allowed" : "pointer" }}>
              Next →
            </button>
          </div>
        )}
      </main>

      {/* AI Insight Modal */}
      {selectedVideo && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(2,6,23,0.85)", backdropFilter: "blur(8px)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
          onClick={() => setSelectedVideo(null)}
        >
          <div
            className="card fade-in"
            style={{ maxWidth: 600, width: "100%", padding: 28, position: "relative" }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedVideo(null)}
              style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 20 }}
            >
              ✕
            </button>

            <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 20 }}>
              {selectedVideo.thumbnail && (
                <img src={selectedVideo.thumbnail} alt="" style={{ width: 80, height: 45, objectFit: "cover", borderRadius: 6, flexShrink: 0 }} />
              )}
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#f1f5f9", lineHeight: 1.4, marginBottom: 4 }}>{selectedVideo.title}</div>
                <div style={{ color: "#64748b", fontSize: 12 }}>📺 {selectedVideo.channelName}</div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
              {[
                { label: "Views/Day", value: formatNum(selectedVideo.viewsPerDay), color: "#38bdf8" },
                { label: "Channel Avg", value: formatNum(selectedVideo.channelAvgViewsPerDay), color: "#94a3b8" },
                { label: "Outperform", value: selectedVideo.outperformRatio + "x", color: "#a78bfa" },
              ].map(m => (
                <div key={m.label} style={{ background: "#020617", borderRadius: 8, padding: "12px", textAlign: "center" }}>
                  <div style={{ color: m.color, fontWeight: 800, fontSize: 18 }}>{m.value}</div>
                  <div style={{ color: "#475569", fontSize: 11, marginTop: 2 }}>{m.label}</div>
                </div>
              ))}
            </div>

            <div style={{ borderTop: "1px solid #1e293b", paddingTop: 20 }}>
              <div style={{ color: "#7c3aed", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>🤖 Gemini AI Analysis</div>
              {insightLoading ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#64748b", fontSize: 14 }}>
                  <span className="spinner" />
                  Generating insight…
                </div>
              ) : insight ? (
                <div style={{ color: "#cbd5e1", fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{insight}</div>
              ) : (
                <div style={{ color: "#475569", fontSize: 14 }}>Click to generate AI insight for this video.</div>
              )}
            </div>

            <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
              <a
                href={selectedVideo.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ flex: 1, textAlign: "center", background: "#1e293b", color: "#94a3b8", borderRadius: 10, padding: "10px", fontSize: 13, textDecoration: "none", fontWeight: 600 }}
              >
                ▶ Watch on YouTube
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{ borderTop: "1px solid #0f172a", padding: "24px", textAlign: "center", color: "#334155", fontSize: 12, marginTop: 48 }}>
        YT Intel • Tracking {dbKeywords.length} niches • Daily report sent to krishma939@gmail.com at 4:00 AM IST
      </footer>
    </div>
  );
}
