import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { generateInsight } from "@/lib/gemini";
import Video from "@/models/Video";

export async function POST(req: NextRequest) {
  await connectDB();

  const { videoId } = await req.json();
  if (!videoId) {
    return NextResponse.json({ error: "videoId required" }, { status: 400 });
  }

  const video = await Video.findOne({ videoId });
  if (!video) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  // Generate or return cached insight
  if (video.aiInsight) {
    return NextResponse.json({ insight: video.aiInsight });
  }

  const insight = await generateInsight({
    title: video.title,
    channelName: video.channelName,
    views: video.views,
    viewsPerDay: video.viewsPerDay,
    channelAvgViewsPerDay: video.channelAvgViewsPerDay,
    outperformRatio: video.outperformRatio,
    description: video.description,
  });

  video.aiInsight = insight;
  await video.save();

  return NextResponse.json({ insight });
}
