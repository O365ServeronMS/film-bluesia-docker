import Link from "next/link";
import { ArrowLeft, Heart } from "lucide-react";
import { StoredMovieGrid } from "@/components/StoredMovieGrid";

export default function FavoritesPage() {
  return (
    <>
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-white/5 bg-[#07090f]/90 px-4 py-4 backdrop-blur-xl">
        <Link href="/" className="grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white"><ArrowLeft className="h-5 w-5" /></Link>
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black"><Heart className="h-6 w-6 text-gold" /> Yêu thích</h1>
          <p className="text-sm text-zinc-400">Kho phim cá nhân trên trình duyệt này.</p>
        </div>
      </header>
      <StoredMovieGrid type="favorites" />
    </>
  );
}
