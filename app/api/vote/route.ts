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
import { NextResponse } from "next/server";
import Mood from "@/models/mood";
import { connectToDatabase } from "@/lib/mongoose";

export async function POST(req: Request) {
  try {
    await connectToDatabase();

    // read request body
    const { mood } = await req.json().catch(() => ({}));

    if (!mood || !["good", "bad"].includes(mood)) {
      return NextResponse.json(
        { success: false, error: "Invalid mood" },
        { status: 400 }
      );
    }

    // ---------- COUNTRY DETECTION ----------
    // DigitalOcean App Platform adds: x-geo-country
    const countryHeader = req.headers.get("x-geo-country");

    // fallback to forwarded IP
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "";

    // Final country logic:
    // 1. DigitalOcean Geo header
    // 2. If no country, fallback to "UN"
    console.log(countryHeader);
    const country =
  // DigitalOcean App Platform
  req.headers.get("x-geo-country")?.toUpperCase()
  // Vercel
  || req.headers.get("x-vercel-ip-country")?.toUpperCase()
  // Cloudflare (if you ever use it)
  || req.headers.get("cf-ipcountry")?.toUpperCase()
  // fallback to first forwarded IP (you'd only use this if you plan to call an IP->geo API)
  || (req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "")
  // finally, server-side fallback
  || process.env.DEFAULT_COUNTRY?.toUpperCase()
  || "UN";

    console.log("Detected Country:", country, "IP:", ip);

    // ---------- UPDATE DATABASE ----------
    const update =
      mood === "good"
        ? { $inc: { good: 1 } }
        : { $inc: { bad: 1 } };

    await Mood.updateOne({ country }, update, { upsert: true });

    const doc = await Mood.findOne({ country }).lean();

    return NextResponse.json({ success: true, country: doc });
  } catch (err) {
    console.error("Error in /api/vote:", err);
    return NextResponse.json(
      { success: false, error: "Internal error" },
      { status: 500 }
    );
  }
}
