import { NextResponse } from "next/server";
import { getHome } from "@/lib/ophim";

export const runtime = "nodejs";

export async function GET() {
  try {
    const data = await getHome();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=1800" }
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 502 });
  }
}
