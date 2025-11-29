// app/api/vote/route.ts
import { NextResponse } from "next/server";
import Mood from "@/models/mood";
import { connectToDatabase } from "@/lib/mongoose";
import * as geoip from "geoip-lite"


function getClientIpFromReq(reqHeaders: Headers) {
  // x-forwarded-for may contain a comma-separated list; take first non-empty
  const xff = reqHeaders.get("x-forwarded-for") || reqHeaders.get("x-real-ip") || "";
  if (!xff) return "";
  return xff.split(",")[0].trim();
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();

    // body (we accept mood only from client)
    const { mood } = await req.json();

    if (!mood || !["good", "bad"].includes(mood)) {
      return NextResponse.json({ success: false, error: "Invalid mood" }, { status: 400 });
    }

    const ip = getClientIpFromReq((req as any).headers ?? new Headers());
    let country = "IN" ;

    if (ip) {
      const geo = geoip.lookup(ip);
      if (geo && geo.country) country = geo.country.toUpperCase();
      console.log("the coutry code -------------------------------------------------")
      console.log(country);
    } else {
      // optional: set a test fallback for local dev
      country = "IN";
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
