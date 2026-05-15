import { NextResponse } from "next/server";
import { getMovie } from "@/lib/ophim";

export const runtime = "nodejs";

type Params = { params: { slug: string } };

export async function GET(_: Request, { params }: Params) {
  try {
    const data = await getMovie(params.slug);
    return NextResponse.json(data, {
      headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=1800" }
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 502 });
  }
}
