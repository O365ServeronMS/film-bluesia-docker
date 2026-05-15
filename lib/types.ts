export type MovieCard = {
  name: string;
  originName?: string;
  slug: string;
  poster: string;
  thumb: string;
  year?: number | string;
  quality?: string;
  lang?: string;
  type?: string;
  status?: string;
  episodeCurrent?: string;
  time?: string;
  tmdb?: { vote_average?: number; vote_count?: number };
  imdb?: { id?: string; rating?: number };
  country?: string;
  category?: string;
};

export type Episode = {
  name: string;
  slug?: string;
  filename?: string;
  linkEmbed?: string;
  linkM3u8?: string;
};

export type EpisodeServer = {
  serverName: string;
  serverData: Episode[];
};

export type MovieDetail = MovieCard & {
  content?: string;
  actor?: string[];
  director?: string[];
  episodeTotal?: string;
  categoryList?: { id?: string; name: string; slug: string }[];
  countryList?: { id?: string; name: string; slug: string }[];
  episodes: EpisodeServer[];
};

export type HomePayload = {
  hero: MovieCard[];
  sections: { title: string; href: string; items: MovieCard[] }[];
};

export type ListPayload = {
  title: string;
  items: MovieCard[];
  page: number;
  totalPages?: number;
};
