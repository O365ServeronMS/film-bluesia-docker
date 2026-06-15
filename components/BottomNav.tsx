"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Clapperboard, Film, Home, MonitorPlay, Settings, Sparkles } from "lucide-react";
import {
  fallbackReturnToForSource,
  getActiveNavKey,
  navSourceFromPath,
  navSourceFromSearchParams,
  validNavSourceKey
} from "@/lib/navigation";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Trang chủ", icon: Home },
  { href: "/list/phim-le", label: "Phim lẻ", icon: Film },
  { href: "/list/phim-bo", label: "Phim bộ", icon: MonitorPlay },
  { href: "/list/tv-shows", label: "TV Show", icon: Clapperboard },
  { href: "/list/hoat-hinh", label: "Hoạt hình", icon: Sparkles },
  { href: "/settings", label: "Cài đặt", icon: Settings }
];

const LAST_NAV_SECTION_KEY = "film.bluesia.net:last-nav-section";

function keyForItemHref(href: string) {
  return href === "/settings" ? "settings" : navSourceFromPath(href);
}

function legacyHashSource() {
  if (typeof window === "undefined") return "";
  try {
    return validNavSourceKey(new URLSearchParams(window.location.hash.replace(/^#/, "")).get("from"));
  } catch {
    return "";
  }
}

function storedLastSource() {
  if (typeof window === "undefined") return "";
  try {
    return validNavSourceKey(sessionStorage.getItem(LAST_NAV_SECTION_KEY));
  } catch {
    return "";
  }
}

export function BottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const pathKey = navSourceFromPath(pathname);
    if (pathKey && pathKey !== "home") {
      try {
        sessionStorage.setItem(LAST_NAV_SECTION_KEY, pathKey);
      } catch {
        // Ignore unavailable storage.
      }
    }
  }, [pathname]);

  const fallbackKey = storedLastSource() || legacyHashSource();
  const activeKey = (() => {
    const direct = getActiveNavKey(pathname, searchParams);
    if (direct) return direct;
    if (pathname.startsWith("/movie/") || pathname.startsWith("/watch/")) {
      return navSourceFromSearchParams(searchParams) || navSourceFromPath(fallbackReturnToForSource(fallbackKey)) || fallbackKey;
    }
    return "";
  })();

  return (
    <nav className="bottom-nav fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[720px] border-t border-white/5 bg-[#0b0d13]/95 px-2 pb-[calc(10px+env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl">
      <div className="bottom-nav-grid grid grid-cols-6 gap-1">
        {items.map((item) => {
          const active = activeKey === keyForItemHref(item.href);
          const Icon = item.icon;
          return (
            <Link
              href={item.href}
              key={item.href}
              className={cn(
                "bottom-nav-item flex flex-col items-center justify-center rounded-2xl px-1 py-2 text-[11px] font-medium text-zinc-400 transition",
                active && "bg-gold/20 text-gold shadow-glow"
              )}
            >
              <Icon className="bottom-nav-icon mb-1 h-5 w-5" />
              <span className="bottom-nav-label whitespace-nowrap">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
