"use client";

import { useMemo, useSyncExternalStore } from "react";
import { Check, Clock3, Heart, Plus } from "lucide-react";
import type { MovieCard } from "@/lib/types";

const FAV_KEY = "phim.bluesia.net:favorites";
const HISTORY_KEY = "phim.bluesia.net:history";
const LOCAL_MOVIES_UPDATED_EVENT = "phim.bluesia.net:local-movies-updated";

type StoredMovie = MovieCard & { savedAt: number };

function readRaw(key: string): StoredMovie[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

function write(key: string, movies: StoredMovie[]) {
  localStorage.setItem(key, JSON.stringify(movies.slice(0, 100)));
  window.dispatchEvent(new Event(LOCAL_MOVIES_UPDATED_EVENT));
}

function subscribeToLocalMovies(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener("focus", onStoreChange);
  window.addEventListener(LOCAL_MOVIES_UPDATED_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("focus", onStoreChange);
    window.removeEventListener(LOCAL_MOVIES_UPDATED_EVENT, onStoreChange);
  };
}

function useStoredMovies(storageKey: string) {
  const snapshot = useSyncExternalStore(
    subscribeToLocalMovies,
    () => JSON.stringify(readRaw(storageKey)),
    () => "[]"
  );

  return useMemo(() => JSON.parse(snapshot) as StoredMovie[], [snapshot]);
}

export function addHistory(movie: MovieCard) {
  if (typeof window === "undefined") return;
  const current = readRaw(HISTORY_KEY).filter((item) => item.slug !== movie.slug);
  write(HISTORY_KEY, [{ ...movie, savedAt: Date.now() }, ...current]);
}

export function useLocalMovies(key: "favorites" | "history") {
  const storageKey = key === "favorites" ? FAV_KEY : HISTORY_KEY;
  const items = useStoredMovies(storageKey);
  return { items, setItems: (next: StoredMovie[]) => write(storageKey, next) };
}

export function MovieActions({ movie }: { movie: MovieCard }) {
  const favorites = useStoredMovies(FAV_KEY);
  const isFavorite = useMemo(() => favorites.some((item) => item.slug === movie.slug), [favorites, movie.slug]);

  const toggleFavorite = () => {
    const current = readRaw(FAV_KEY);
    const next = current.some((item) => item.slug === movie.slug)
      ? current.filter((item) => item.slug !== movie.slug)
      : [{ ...movie, savedAt: Date.now() }, ...current];
    write(FAV_KEY, next);
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      <button onClick={toggleFavorite} className="flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold text-white ring-1 ring-white/10 transition hover:bg-white/15">
        {isFavorite ? <Check className="h-5 w-5 text-gold" /> : <Heart className="h-5 w-5" />}
        {isFavorite ? "Đã lưu" : "Yêu thích"}
      </button>
      <button onClick={() => addHistory(movie)} className="flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold text-white ring-1 ring-white/10 transition hover:bg-white/15">
        <Clock3 className="h-5 w-5" />
        Lưu lịch sử
      </button>
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-4 mt-8 rounded-3xl border border-dashed border-white/15 bg-white/5 p-8 text-center">
      <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-gold/15 text-gold">
        <Plus className="h-7 w-7" />
      </div>
      <h2 className="text-xl font-black">{title}</h2>
      <p className="mt-2 text-sm text-zinc-400">{description}</p>
    </div>
  );
}
