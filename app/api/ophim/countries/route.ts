import { NextResponse } from "next/server";
import { sharedCacheHeaders } from "@/lib/httpCache";
import { getCountries } from "@/lib/ophim";

export const runtime = "nodejs";

export async function GET() {
  try {
    const data = await getCountries();
    return NextResponse.json(data, {
      headers: sharedCacheHeaders(86400, 604800, 3600)
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 502 });
  }
}
