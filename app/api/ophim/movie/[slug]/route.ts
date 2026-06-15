import { NextResponse } from "next/server";
import { sharedCacheHeaders } from "@/lib/httpCache";
import { withSignedMovieDetailImages } from "@/lib/movie-images.server";
import { getMovie } from "@/lib/ophim";

export const runtime = "nodejs";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_: Request, props: Params) {
  const params = await props.params;
  try {
    const data = withSignedMovieDetailImages(await getMovie(params.slug));
    return NextResponse.json(data, {
      headers: sharedCacheHeaders(900, 86400)
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 502 });
  }
}
