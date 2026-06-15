import { NextRequest, NextResponse } from "next/server";
import { sharedCacheHeaders } from "@/lib/httpCache";
import { withSignedListImages } from "@/lib/movie-images.server";
import { getList } from "@/lib/ophim";

export const runtime = "nodejs";

type Params = { params: Promise<{ type: string }> };

export async function GET(req: NextRequest, props: Params) {
  const params = await props.params;
  try {
    const page = Number(req.nextUrl.searchParams.get("page") || "1");
    const limit = Number(req.nextUrl.searchParams.get("limit") || "24");
    const country = req.nextUrl.searchParams.get("country") || undefined;
    const category = req.nextUrl.searchParams.get("category") || undefined;
    const data = withSignedListImages(await getList(params.type, page, limit, country, category));
    return NextResponse.json(data, {
      headers: sharedCacheHeaders(600, 3600)
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 502 });
  }
}
