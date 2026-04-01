import { ParsedVideo } from "./scraping-dog";

export interface ScoredVideo extends ParsedVideo {
  channelAvgViewsPerDay: number;
  outperformRatio: number;
  isOutperforming: boolean;
}

/**
 * Given a list of videos (possibly from multiple channels),
 * group by channel and compute each channel's average views/day.
 * Flag any video that is >= 2x the channel average as outperforming.
 */
export function scoreVideos(videos: ParsedVideo[]): ScoredVideo[] {
  // Group by channelName
  const byChannel: Record<string, ParsedVideo[]> = {};
  for (const v of videos) {
    const key = v.channelName || "unknown";
    if (!byChannel[key]) byChannel[key] = [];
    byChannel[key].push(v);
  }

  const scored: ScoredVideo[] = [];

  for (const [, channelVideos] of Object.entries(byChannel)) {
    // Compute channel average views/day (ignore outliers by using median)
    const sorted = [...channelVideos].sort((a, b) => a.viewsPerDay - b.viewsPerDay);
    const mid = Math.floor(sorted.length / 2);
    const channelAvg =
      sorted.length % 2 === 0
        ? (sorted[mid - 1].viewsPerDay + sorted[mid].viewsPerDay) / 2
        : sorted[mid].viewsPerDay;

    const avg = Math.max(channelAvg, 100); // floor to avoid division noise

    for (const v of channelVideos) {
      const ratio = parseFloat((v.viewsPerDay / avg).toFixed(2));
      scored.push({
        ...v,
        channelAvgViewsPerDay: Math.round(avg),
        outperformRatio: ratio,
        isOutperforming: ratio >= 2.0,
      });
    }
  }

  // Sort by ratio descending
  return scored.sort((a, b) => b.outperformRatio - a.outperformRatio);
}
