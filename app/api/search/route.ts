import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { searchYouTube, NICHE_KEYWORDS } from "@/lib/scraping-dog";
import { scoreVideos } from "@/lib/scorer";
import Video from "@/models/Video";
import Keyword from "@/models/Keyword";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST() {
  await connectDB();

  // Get keywords from DB, or seed if empty
  let keywords = await Keyword.find({});
  if (keywords.length === 0) {
    const seeded = await Promise.all(
      NICHE_KEYWORDS.map((text) => Keyword.create({ text }))
    );
    keywords = (seeded as any);
  }

  const allParsedVideos: any[] = [];
  const startTime = Date.now();
  const TIMEOUT_BUFFER = 3000; // 3 seconds buffer
  const MAX_DURATION = parseInt(process.env.MAX_DURATION || "10"); 
  const MAX_RUNTIME = (MAX_DURATION * 1000) - TIMEOUT_BUFFER;

  // Search each keyword
  for (const kw of keywords) {
    // Check if we are approaching timeout
    if (Date.now() - startTime > MAX_RUNTIME) {
      console.warn(`[Search] Approaching timeout, stopping after ${allParsedVideos.length} videos`);
      break;
    }

    try {
      console.log(`[Search] Searching for: "${kw.text}"`);
      const results = await searchYouTube(kw.text);
      allParsedVideos.push(...results.map((v) => ({ ...v, keyword: kw.text })));
      
      // Update lastSearched timestamp
      await Keyword.findByIdAndUpdate(kw._id, { lastSearched: new Date() });
      
      // Delay slightly to prevent rate limits
      await new Promise((r) => setTimeout(r, 500));
    } catch (err: any) {
      console.error(`[Search] Error searching for "${kw.text}":`, err.message);
      // If it's a configuration error (missing API key), stop immediately
      if (err.message.includes("API_KEY")) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
      }
    }
  }

  if (allParsedVideos.length === 0) {
    return NextResponse.json({
      success: true,
      totalFetched: 0,
      saved: 0,
      outperforming: 0,
      message: "No videos found. Check your API key and keyword configuration."
    });
  }

  // Score & save to DB
  const scored = scoreVideos(allParsedVideos);
  let savedCount = 0;

  for (const v of scored) {
    try {
      await Video.findOneAndUpdate(
        { videoId: v.videoId },
        { ...v, fetchedAt: new Date() },
        { upsert: true, new: true }
      );
      savedCount++;
    } catch (err) {
      // skip errors
    }
  }

  return NextResponse.json({
    success: true,
    totalFetched: allParsedVideos.length,
    saved: savedCount,
    outperforming: scored.filter((v) => v.isOutperforming).length,
  });
}
