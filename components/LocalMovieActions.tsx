"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Clock3, Heart, Plus } from "lucide-react";
import type { MovieCard } from "@/lib/types";

const FAV_KEY = "bluesia:favorites";
const HISTORY_KEY = "bluesia:history";

type StoredMovie = MovieCard & { savedAt: number };

function read(key: string): StoredMovie[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

function write(key: string, movies: StoredMovie[]) {
  localStorage.setItem(key, JSON.stringify(movies.slice(0, 100)));
  window.dispatchEvent(new Event("bluesia:local-movies-updated"));
}

export function addHistory(movie: MovieCard) {
  if (typeof window === "undefined") return;
  const current = read(HISTORY_KEY).filter((item) => item.slug !== movie.slug);
  write(HISTORY_KEY, [{ ...movie, savedAt: Date.now() }, ...current]);
}

export function useLocalMovies(key: "favorites" | "history") {
  const storageKey = key === "favorites" ? FAV_KEY : HISTORY_KEY;
  const [items, setItems] = useState<StoredMovie[]>([]);
  useEffect(() => setItems(read(storageKey)), [storageKey]);
  return { items, setItems: (next: StoredMovie[]) => { setItems(next); write(storageKey, next); } };
}

export function MovieActions({ movie }: { movie: MovieCard }) {
  const [favorites, setFavorites] = useState<StoredMovie[]>([]);
  const isFavorite = useMemo(() => favorites.some((item) => item.slug === movie.slug), [favorites, movie.slug]);

  useEffect(() => {
    setFavorites(read(FAV_KEY));
  }, []);

  const toggleFavorite = () => {
    const current = read(FAV_KEY);
    const next = current.some((item) => item.slug === movie.slug)
      ? current.filter((item) => item.slug !== movie.slug)
      : [{ ...movie, savedAt: Date.now() }, ...current];
    write(FAV_KEY, next);
    setFavorites(next);
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
