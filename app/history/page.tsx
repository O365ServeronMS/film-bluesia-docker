import Link from "next/link";
import { ArrowLeft, Clock3 } from "lucide-react";
import { StoredMovieGrid } from "@/components/StoredMovieGrid";

export default function HistoryPage() {
  return (
    <>
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-white/5 bg-[#07090f]/90 px-4 py-4 backdrop-blur-xl">
        <Link href="/" className="grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white"><ArrowLeft className="h-5 w-5" /></Link>
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black"><Clock3 className="h-6 w-6 text-gold" /> Lịch sử</h1>
          <p className="text-sm text-zinc-400">Tự động lưu khi bạn mở trang xem phim.</p>
        </div>
      </header>
      <StoredMovieGrid type="history" />
    </>
  );
}
