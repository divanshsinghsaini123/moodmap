// // app/api/vote/route.ts
// import { NextResponse } from "next/server";
// import Mood from "@/models/mood";
// import { connectToDatabase } from "@/lib/mongoose";

// export async function POST(req: Request) {
//   try {
//     await connectToDatabase();

//     // body (we accept mood only from client)
//     const { mood } = await req.json();
//     console.log(mood) 
//     if (!mood || !["good", "bad"].includes(mood)) {
//       return NextResponse.json({ success: false, error: "Invalid mood" }, { status: 400 });
//     }

//     // middleware sets this
//     const country = req.headers.get("x-country-code");
//     console.log(country);
//     if (!country) {
//       return NextResponse.json({ success: false, error: "Country missing" }, { status: 400 });
//     }

//     // update
//     const update = mood === "good"
//       ? { $inc: { good: 1 } }
//       : { $inc: { bad: 1 } };

//     await Mood.updateOne(
//       { country },
//       update,
//       { upsert: true }
//     );

//     // get updated doc
//     const doc = await Mood.findOne({ country }).lean();

//     return NextResponse.json({ success: true, country: doc });
//   } catch (err) {
//     console.error("Error in /api/vote:", err);
//     return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
//   }
// }

// app/api/vote/route.ts
// app/api/vote/route.ts
import { NextResponse } from "next/server";
import Mood from "@/models/mood";
import { connectToDatabase } from "@/lib/mongoose";

export async function POST(req: Request) {
  try {
    await connectToDatabase();

    // parse body safely
    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const mood = String((body as { mood?: unknown }).mood ?? "").toLowerCase();

    if (!mood || !["good", "bad"].includes(mood)) {
      return NextResponse.json({ success: false, error: "Invalid mood" }, { status: 400 });
    }

    // prefer platform geo headers, then common cloud headers, then fallback env
    const headers = req.headers;
    const countryHeader =
      headers.get("x-geo-country")?.toUpperCase() || // DigitalOcean App Platform
      headers.get("x-vercel-ip-country")?.toUpperCase() || // Vercel
      headers.get("cf-ipcountry")?.toUpperCase(); // Cloudflare

    // fallback to first forwarded IP (for logging/optional external lookup)
    const forwardedIp = headers.get("x-forwarded-for")?.split(",")[0].trim() || headers.get("x-real-ip") || "";

    // final country decision: prefer platform header, else DEFAULT_COUNTRY env, else UN
    const country = countryHeader ?? process.env.DEFAULT_COUNTRY?.toUpperCase() ?? "UN";

    // debug log (safe)
    console.log("Detected Country:", country, "Forwarded IP:", forwardedIp);

    const update = mood === "good" ? { $inc: { good: 1 } } : { $inc: { bad: 1 } };

    await Mood.updateOne({ country }, update, { upsert: true });

    const doc = await Mood.findOne({ country }).lean();

    return NextResponse.json({ success: true, country: doc });
  } catch (err) {
    console.error("Error in /api/vote:", err);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}
