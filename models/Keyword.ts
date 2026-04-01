import mongoose, { Schema, Document } from "mongoose";

export interface IKeyword extends Document {
  text: string;
  lastSearched?: Date;
  createdAt: Date;
}

const KeywordSchema = new Schema<IKeyword>({
  text: { type: String, required: true, unique: true, trim: true },
  lastSearched: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Keyword || mongoose.model<IKeyword>("Keyword", KeywordSchema);
