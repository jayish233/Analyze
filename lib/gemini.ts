import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface VideoInsightInput {
  title: string;
  channelName: string;
  views: number;
  viewsPerDay: number;
  channelAvgViewsPerDay: number;
  outperformRatio: number;
  description: string;
}

/**
 * Generate a brief AI insight explaining why this video is outperforming
 * and suggest content angles for your channel.
 */
export async function generateInsight(video: VideoInsightInput): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are a YouTube growth strategist. Analyze this video and explain in 3-4 sentences why it's outperforming.

Video Info:
- Title: "${video.title}"
- Channel: ${video.channelName}
- Total Views: ${video.views.toLocaleString()}
- Views Per Day: ${video.viewsPerDay.toLocaleString()}
- Channel Average Views/Day: ${video.channelAvgViewsPerDay.toLocaleString()}
- Outperform Ratio: ${video.outperformRatio}x (${video.outperformRatio >= 2 ? "OUTPERFORMING" : "normal"})
- Description snippet: ${video.description.slice(0, 300)}

Give:
1. Why it's winning (title hook, topic timing, search intent)
2. One content idea for a similar video on an AI/coding/startup channel

Keep it concise and actionable.`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (err: any) {
    console.error("[Gemini] Error:", err?.message);
    return "AI insight unavailable.";
  }
}

/**
 * Generate a batch summary for the email report (top outperforming videos).
 */
export async function generateEmailSummary(
  videos: VideoInsightInput[]
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const top = videos.slice(0, 5);

    const videoList = top
      .map(
        (v, i) =>
          `${i + 1}. "${v.title}" by ${v.channelName} — ${v.outperformRatio}x outperforming (${v.viewsPerDay.toLocaleString()} views/day)`
      )
      .join("\n");

    const prompt = `You are a YouTube growth analyst. Based on these top outperforming videos in the WebDev/AI niche today:
${videoList}

Write a 3-sentence daily trend summary for a creator who makes videos about AI, coding, automation, and startup ideas.
Focus on the dominant themes and what topics are trending right now. Be punchy and actionable.`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (err: any) {
    console.error("[Gemini] Batch error:", err?.message);
    return "Today's top WebDev & AI videos have been analyzed.";
  }
}
