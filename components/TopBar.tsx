"use client";

import Link from "next/link";
import { Clock3, Heart, Search, UserRound } from "lucide-react";

export function TopBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-[#07090f]/90 px-4 py-4 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <Link href="/search" className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-zinc-400 shadow-sm">
          <Search className="h-5 w-5 shrink-0" />
          <span className="truncate text-sm">Tìm kiếm phim, diễn viên...</span>
        </Link>
        <Link href="/favorites" className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-white/10 bg-white/10 text-zinc-300">
          <Heart className="h-5 w-5" />
        </Link>
        <Link href="/history" className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-white/10 bg-white/10 text-zinc-300">
          <Clock3 className="h-5 w-5" />
        </Link>
        <Link href="/settings" className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-white/10 bg-white/10 text-zinc-300">
          <UserRound className="h-5 w-5" />
        </Link>
      </div>
    </header>
  );
}
