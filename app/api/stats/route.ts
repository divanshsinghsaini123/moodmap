// app/api/stats/route.ts
import { NextResponse } from "next/server";
import Mood from "@/models/mood";
import { connectToDatabase } from "@/lib/mongoose";

export async function GET() {
  try {
    await connectToDatabase();

    const docs = await Mood.find({}).lean();

    // sort by total votes (good + bad) descending
    docs.sort((a, b) => (b.good + b.bad) - (a.good + a.bad));

    // return NextResponse.json({ success: true, stats: docs });
    return new NextResponse(JSON.stringify({ success: true, stats : docs }), {
    headers: {
      "Content-Type": "application/json",
      // 🔥 CACHE HERE (10 seconds)
      "Cache-Control": "public, max-age=10, stale-while-revalidate=59",
    },
  });
  } catch (err) {
    console.error("Error in /api/stats:", err);
    return NextResponse.json({ success: false, error: "internal" }, { status: 500 });
  }
}
