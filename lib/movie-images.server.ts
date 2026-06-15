import "server-only";

import { getSignedMovieImageSources } from "@/lib/image-signing.server";
import type { HomePayload, ListPayload, MovieCard, MovieDetail } from "@/lib/types";

export function withSignedMovieImages<T extends MovieCard>(movie: T): T {
  return {
    ...movie,
    posterSources: getSignedMovieImageSources(movie.poster),
    thumbSources: getSignedMovieImageSources(movie.thumb)
  };
}

export function withSignedListImages<T extends ListPayload>(payload: T): T {
  return {
    ...payload,
    items: payload.items.map(withSignedMovieImages)
  };
}

export function withSignedHomeImages(payload: HomePayload): HomePayload {
  return {
    ...payload,
    hero: payload.hero.map(withSignedMovieImages),
    sections: payload.sections.map((section) => ({
      ...section,
      items: section.items.map(withSignedMovieImages)
    }))
  };
}

export function withSignedMovieDetailImages(movie: MovieDetail): MovieDetail {
  return withSignedMovieImages(movie);
}
