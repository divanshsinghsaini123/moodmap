// app/api/vote/route.ts
import { NextResponse } from "next/server";
import Mood from "@/models/mood";
import { connectToDatabase } from "@/lib/mongoose";

export async function POST(req: Request) {
  try {
    await connectToDatabase();

    // body (we accept mood only from client)
    const { mood } = await req.json();

    if (!mood || !["good", "bad"].includes(mood)) {
      return NextResponse.json({ success: false, error: "Invalid mood" }, { status: 400 });
    }

    // middleware sets this
    const country = req.headers.get("x-country-code");

    if (!country) {
      return NextResponse.json({ success: false, error: "Country missing" }, { status: 400 });
    }

    // update
    const update = mood === "good"
      ? { $inc: { good: 1 } }
      : { $inc: { bad: 1 } };

    await Mood.updateOne(
      { country },
      update,
      { upsert: true }
    );

    // get updated doc
    const doc = await Mood.findOne({ country }).lean();

    return NextResponse.json({ success: true, country: doc });
  } catch (err) {
    console.error("Error in /api/vote:", err);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}
