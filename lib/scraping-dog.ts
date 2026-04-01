import axios from "axios";

const API_KEY = process.env.SCRAPINGDOG_API_KEY!;
const BASE_URL = "https://api.scrapingdog.com/youtube";

export interface ParsedVideo {
  videoId: string;
  title: string;
  channelName: string;
  channelId: string;
  thumbnail: string;
  views: number;
  publishedDate: Date;
  description: string;
  url: string;
  viewsPerDay: number;
}

/** Extracts videoId from a URL like https://www.youtube.com/watch?v=dQw4w9WgXcQ */
function extractVideoId(url: string): string {
  try {
    const u = new URL(url);
    return u.searchParams.get("v") || "";
  } catch (e) {
    return "";
  }
}

export function parseViews(raw: string): number {
  if (!raw) return 0;
  const clean = raw.toLowerCase().replace(/[^0-9.kmb]/g, "");
  const num = parseFloat(clean);
  if (isNaN(num)) return 0;
  if (raw.toLowerCase().includes("b")) return Math.round(num * 1_000_000_000);
  if (raw.toLowerCase().includes("m")) return Math.round(num * 1_000_000);
  if (raw.toLowerCase().includes("k")) return Math.round(num * 1_000);
  return Math.round(num);
}

export function parsePublishedDate(raw: string): Date {
  const now = new Date();
  if (!raw) return now;
  const lower = raw.toLowerCase();
  const match = lower.match(/(\d+)\s+(second|minute|hour|day|week|month|year)/);
  if (!match) return now;
  const amount = parseInt(match[1]);
  const unit = match[2];
  const msMap: Record<string, number> = {
    second: 1000,
    minute: 60 * 1000,
    hour: 60 * 60 * 1000,
    day: 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000,
    month: 30 * 24 * 60 * 60 * 1000,
    year: 365 * 24 * 60 * 60 * 1000,
  };
  const ms = (msMap[unit] || 0) * amount;
  return new Date(now.getTime() - ms);
}

function calcViewsPerDay(views: number, publishedDate: Date): number {
  const now = new Date();
  const days = Math.max(1, (now.getTime() - publishedDate.getTime()) / (1000 * 60 * 60 * 24));
  return Math.round(views / days);
}

export async function searchYouTube(query: string): Promise<ParsedVideo[]> {
  try {
    if (!API_KEY || API_KEY.includes("your_actual_scrapingdog_key")) {
      throw new Error("SCRAPINGDOG_API_KEY is missing or not configured.");
    }

    // ScrapingDog YouTube Search requires 'search_query' parameter
    const res = await axios.get(`${BASE_URL}/search`, {
      params: { api_key: API_KEY, search_query: query, country: "us" },
      timeout: 30000,
    });

    const data = res.data;
    // The key for videos in the response is 'video_results'
    const rawVideos: any[] = data?.video_results || [];

    console.log(`[ScrapingDog] Found ${rawVideos.length} raw results for "${query}"`);

    return rawVideos.map((v: any) => {
      const url = v.link || "";
      const videoId = extractVideoId(url);
      const views = parseViews(v.views || "0");
      const publishedAt = parsePublishedDate(v.published_date || "");
      
      return {
        videoId: videoId,
        title: v.title || "",
        channelName: v.channel?.name || "Unknown Channel",
        channelId: v.channel?.link ? v.channel.link.split("/").pop() : "",
        thumbnail: v.thumbnail?.static || v.thumbnail || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        views,
        publishedDate: publishedAt,
        description: v.description || "",
        url: url,
        viewsPerDay: calcViewsPerDay(views, publishedAt),
      };
    }).filter((v) => v.videoId && v.title);
  } catch (err: any) {
    console.error(`[ScrapingDog] Error for query "${query}":`, err?.message);
    if (err.response) {
      console.error("[ScrapingDog] Response Status:", err.response.status);
      console.error("[ScrapingDog] Response Data:", JSON.stringify(err.response.data).slice(0, 500));
    }
    return [];
  }
}

export const NICHE_KEYWORDS = [
  "AI tools 2025",
  "web development tutorial 2025",
  "Next.js tutorial",
  "React best practices",
  "AI automation",
  "machine learning beginners",
  "startup ideas AI",
  "coding tutorial",
  "ChatGPT automation",
  "build AI app",
  "programming for beginners",
  "software engineer vlog",
  "full stack developer",
  "Python AI tutorial",
  "AI side project",
];
