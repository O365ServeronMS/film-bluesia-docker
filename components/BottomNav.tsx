"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clapperboard, Film, Home, MonitorPlay, Settings, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Trang chủ", icon: Home },
  { href: "/list/phim-le", label: "Phim lẻ", icon: Film },
  { href: "/list/phim-bo", label: "Phim bộ", icon: MonitorPlay },
  { href: "/list/tv-shows", label: "TV Show", icon: Clapperboard },
  { href: "/list/hoat-hinh", label: "Hoạt hình", icon: Sparkles },
  { href: "/settings", label: "Cài đặt", icon: Settings }
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[720px] border-t border-white/5 bg-[#0b0d13]/95 px-2 pb-[calc(10px+env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl">
      <div className="grid grid-cols-6 gap-1">
        {items.map((item) => {
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              href={item.href}
              key={item.href}
              className={cn(
                "flex flex-col items-center justify-center rounded-2xl px-1 py-2 text-[11px] font-medium text-zinc-400 transition",
                active && "bg-gold/20 text-gold shadow-glow"
              )}
            >
              <Icon className="mb-1 h-5 w-5" />
              <span className="whitespace-nowrap">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
