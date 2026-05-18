import { NextResponse } from "next/server";
import { getCountries } from "@/lib/ophim";

export const runtime = "nodejs";

export async function GET() {
  try {
    const data = await getCountries();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400" }
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 502 });
  }
}
