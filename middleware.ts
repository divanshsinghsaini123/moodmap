// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const config = {
  matcher: ["/api/vote"], // only run middleware on /api/vote
};

export function middleware(req: NextRequest) {
  // Cloudflare injects this header
  const cfCountry = req.headers.get("cf-ipcountry");

  // fallback for local development
  const country = cfCountry || "IN";

  // attach country to request so the route can use it
  const headers = new Headers(req.headers);
  headers.set("x-country-code", country);

  return NextResponse.next({
    request: { headers },
  });
}
