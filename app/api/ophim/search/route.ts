import { NextRequest, NextResponse } from "next/server";
import { searchMovies } from "@/lib/ophim";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const keyword = req.nextUrl.searchParams.get("keyword") || "";
    const page = Number(req.nextUrl.searchParams.get("page") || "1");
    const limit = Number(req.nextUrl.searchParams.get("limit") || "24");
    const data = await searchMovies(keyword, page, limit);
    return NextResponse.json(data, {
      headers: { "Cache-Control": "s-maxage=120, stale-while-revalidate=900" }
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 502 });
  }
}
