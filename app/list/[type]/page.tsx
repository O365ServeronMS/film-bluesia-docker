import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MovieCard } from "@/components/MovieCard";
import { TopBar } from "@/components/TopBar";
import { getList } from "@/lib/ophim";

export const revalidate = 300;

type Props = {
  params: { type: string };
  searchParams?: { page?: string; country?: string; category?: string };
};

const quickCountries = [
  { label: "Âu Mỹ", slug: "au-my" },
  { label: "Hàn Quốc", slug: "han-quoc" }
] as const;

const quickCategories = [
  { label: "Phim chiếu rạp", slug: "phim-chieu-rap" }
] as const;

const countryFilterableTypes = new Set(["phim-le", "phim-bo", "tv-shows"]);
const categoryFilterableTypes = new Set(["phim-le"]);

function normalizeCountry(country?: string) {
  const slug = String(country || "").trim().toLowerCase();
  return quickCountries.some((item) => item.slug === slug) ? slug : "";
}

function normalizeCategory(category?: string) {
  const slug = String(category || "").trim().toLowerCase();
  return quickCategories.some((item) => item.slug === slug) ? slug : "";
}

function listHref(type: string, page: number, filters?: { country?: string; category?: string }) {
  const query = new URLSearchParams({ page: String(Math.max(1, page)) });
  if (filters?.country) query.set("country", filters.country);
  if (filters?.category) query.set("category", filters.category);
  return `/list/${type}?${query.toString()}`;
}

export default async function ListPage({ params, searchParams }: Props) {
  const page = Math.max(1, Number(searchParams?.page || "1"));
  const supportsCountryFilter = countryFilterableTypes.has(params.type);
  const supportsCategoryFilter = categoryFilterableTypes.has(params.type);
  const country = supportsCountryFilter ? normalizeCountry(searchParams?.country) : "";
  const category = supportsCategoryFilter ? normalizeCategory(searchParams?.category) : "";
  const activeFilters = { country, category };
  const data = await getList(params.type, page, 30, country, category);

  return (
    <>
      <TopBar />
      <section className="px-4 pt-6">
        <h1 className="text-3xl font-black tracking-tight">{data.title}</h1>
        <p className="mt-1 text-sm text-zinc-400">Trang {data.page}{data.totalPages ? ` / ${data.totalPages}` : ""}</p>
      </section>

      {supportsCountryFilter || supportsCategoryFilter ? (
        <section className="space-y-3 px-4 pt-4">
          {supportsCountryFilter ? (
            <div aria-label="Lọc nhanh theo quốc gia">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">Quốc gia</p>
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                <Link
                  href={listHref(params.type, 1, { ...activeFilters, country: "" })}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-extrabold ring-1 transition ${!country ? "bg-gold text-black ring-gold" : "bg-white/10 text-zinc-200 ring-white/10"}`}
                >
                  Tất cả
                </Link>
                {quickCountries.map((item) => (
                  <Link
                    key={item.slug}
                    href={listHref(params.type, 1, { ...activeFilters, country: item.slug })}
                    className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-extrabold ring-1 transition ${country === item.slug ? "bg-gold text-black ring-gold" : "bg-white/10 text-zinc-200 ring-white/10"}`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          {supportsCategoryFilter ? (
            <div aria-label="Lọc nhanh theo nhóm phim">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">Nhóm phim</p>
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                <Link
                  href={listHref(params.type, 1, { ...activeFilters, category: "" })}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-extrabold ring-1 transition ${!category ? "bg-gold text-black ring-gold" : "bg-white/10 text-zinc-200 ring-white/10"}`}
                >
                  Tất cả
                </Link>
                {quickCategories.map((item) => (
                  <Link
                    key={item.slug}
                    href={listHref(params.type, 1, { ...activeFilters, category: item.slug })}
                    className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-extrabold ring-1 transition ${category === item.slug ? "bg-gold text-black ring-gold" : "bg-white/10 text-zinc-200 ring-white/10"}`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="grid grid-cols-3 gap-3 px-4 pt-5 sm:grid-cols-4">
        {data.items.map((movie) => <MovieCard key={movie.slug} movie={movie} compact />)}
      </section>
      <div className="flex items-center justify-between gap-3 px-4 pt-8">
        <Link href={listHref(params.type, Math.max(1, page - 1), activeFilters)} className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold text-white ring-1 ring-white/10 aria-disabled:pointer-events-none aria-disabled:opacity-40" aria-disabled={page <= 1}>
          <ChevronLeft className="h-4 w-4" /> Trang trước
        </Link>
        <Link href={listHref(params.type, page + 1, activeFilters)} className="inline-flex items-center gap-2 rounded-2xl bg-gold px-4 py-3 text-sm font-black text-black">
          Trang sau <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </>
  );
}
