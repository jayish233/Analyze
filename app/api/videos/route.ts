import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Video from "@/models/Video";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  await connectDB();

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "18");
  const outperformingOnly = searchParams.get("outperforming") === "true";
  const channel = searchParams.get("channel") || "";
  const keyword = searchParams.get("keyword") || "";

  const query: any = {};
  if (outperformingOnly) query.isOutperforming = true;
  if (channel) query.channelName = { $regex: channel, $options: "i" };
  if (keyword) query.keyword = { $regex: keyword, $options: "i" };

  const total = await Video.countDocuments(query);
  const videos = await Video.find(query)
    .sort({ outperformRatio: -1, fetchedAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const channels = await Video.distinct("channelName");
  const keywords = await Video.distinct("keyword");

  return NextResponse.json({
    videos,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    channels: channels.slice(0, 50),
    keywords,
  });
}
