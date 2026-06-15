import { NextResponse } from "next/server";
import { sharedCacheHeaders } from "@/lib/httpCache";
import { withSignedHomeImages } from "@/lib/movie-images.server";
import { getHome } from "@/lib/ophim";

export const runtime = "nodejs";

export async function GET() {
  try {
    const data = withSignedHomeImages(await getHome());
    return NextResponse.json(data, {
      headers: sharedCacheHeaders(900, 3600)
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 502 });
  }
}
