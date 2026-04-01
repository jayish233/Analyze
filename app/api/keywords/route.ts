import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Keyword from "@/models/Keyword";

export const dynamic = "force-dynamic";

export async function GET() {
  await connectDB();
  const keywords = await Keyword.find({}).sort({ createdAt: -1 });
  return NextResponse.json({ keywords });
}

export async function POST(req: NextRequest) {
  await connectDB();
  const { text } = await req.json();

  if (!text || text.trim().length === 0) {
    return NextResponse.json({ error: "Keyword text is required" }, { status: 400 });
  }

  try {
    const keyword = await Keyword.create({ text: text.trim() });
    return NextResponse.json({ keyword });
  } catch (err: any) {
    if (err.code === 11000) {
      return NextResponse.json({ error: "Keyword already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  await connectDB();
  const { id } = await req.json();

  if (!id) {
    return NextResponse.json({ error: "Keyword ID is required" }, { status: 400 });
  }

  await Keyword.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
