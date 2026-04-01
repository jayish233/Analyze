import mongoose, { Schema, Document } from "mongoose";

export interface IVideo extends Document {
  videoId: string;
  title: string;
  channelName: string;
  channelId: string;
  thumbnail: string;
  views: number;
  publishedDate: Date;
  viewsPerDay: number;
  channelAvgViewsPerDay: number;
  outperformRatio: number;
  isOutperforming: boolean;
  description: string;
  url: string;
  keyword: string;
  aiInsight?: string;
  fetchedAt: Date;
}

const VideoSchema = new Schema<IVideo>({
  videoId:               { type: String, required: true, unique: true },
  title:                 { type: String, required: true },
  channelName:           { type: String, required: true },
  channelId:             { type: String, default: "" },
  thumbnail:             { type: String, default: "" },
  views:                 { type: Number, default: 0 },
  publishedDate:         { type: Date, required: true },
  viewsPerDay:           { type: Number, default: 0 },
  channelAvgViewsPerDay: { type: Number, default: 0 },
  outperformRatio:       { type: Number, default: 0 },
  isOutperforming:       { type: Boolean, default: false },
  description:           { type: String, default: "" },
  url:                   { type: String, default: "" },
  keyword:               { type: String, default: "" },
  aiInsight:             { type: String, default: "" },
  fetchedAt:             { type: Date, default: Date.now },
});

export default mongoose.models.Video || mongoose.model<IVideo>("Video", VideoSchema);
