import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { generateEmailSummary } from "@/lib/gemini";
import { sendDailyReport } from "@/lib/email";
import Video from "@/models/Video";
import { getBaseUrl } from "@/lib/url";


export const maxDuration = 60;

// This endpoint is called by cron-job.org at 4:00 AM IST (22:30 UTC)
export async function POST(req: NextRequest) {
  // Validate cron secret to prevent unauthorized calls
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  // Step 1: Trigger a fresh search
  const baseUrl = getBaseUrl();


  console.log(`[Cron] Triggering search via: ${baseUrl}/api/search`);

  try {
    const searchRes = await fetch(`${baseUrl}/api/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const searchData = await searchRes.json();
    console.log(`[Cron] Search triggered: ${searchData.success ? "Success" : "Failed"}`);
  } catch (e: any) {
    console.warn(`[Cron] Search step failed (${e.message}), using existing DB data`);
  }

  // Step 2: Fetch top outperforming videos from DB
  const videos = await Video.find({ isOutperforming: true })
    .sort({ outperformRatio: -1, fetchedAt: -1 })
    .limit(20)
    .lean();

  if (videos.length === 0) {
    // Fallback: send top by ratio even if not flagged
    const fallback = await Video.find({})
      .sort({ outperformRatio: -1 })
      .limit(10)
      .lean();
    
    if (fallback.length === 0) {
      return NextResponse.json({ error: "No videos in DB yet" }, { status: 500 });
    }
    videos.push(...(fallback as any));
  }

  // Step 3: Generate AI summary
  const aiSummary = await generateEmailSummary(
    videos.slice(0, 5).map((v) => ({
      title: v.title,
      channelName: v.channelName,
      views: v.views,
      viewsPerDay: v.viewsPerDay,
      channelAvgViewsPerDay: v.channelAvgViewsPerDay,
      outperformRatio: v.outperformRatio,
      description: v.description,
    }))
  );

  // Step 4: Send email
  const result = await sendDailyReport(videos as any, aiSummary);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    emailSent: true,
    videosInReport: videos.length,
    timestamp: new Date().toISOString(),
  });
}

// Also allow GET for manual testing in browser
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return POST(
    new NextRequest(req.url, {
      method: "POST",
      headers: { "x-cron-secret": process.env.CRON_SECRET! },
    })
  );
}
