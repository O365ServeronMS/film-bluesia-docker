import { NextResponse } from "next/server";
import { cacheStats, pruneCache } from "@/lib/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  await pruneCache(false);
  const stats = await cacheStats();
  return NextResponse.json(stats, {
    headers: {
      "Cache-Control": "no-store"
    }
  });
}
