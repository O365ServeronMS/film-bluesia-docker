import Link from "next/link";
import { MovieCard } from "@/components/MovieCard";
import { Pagination } from "@/components/Pagination";
import { TopBar } from "@/components/TopBar";
import { withSignedListImages } from "@/lib/movie-images.server";
import { createReturnToPath } from "@/lib/navigation";
import { getList } from "@/lib/ophim";

export const revalidate = 1800;

type Props = {
  params: Promise<{ type: string }>;
  searchParams: Promise<{ page?: string; country?: string; category?: string }>;
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

export default async function ListPage(props: Props) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const page = Math.max(1, Number(searchParams?.page || "1"));
  const supportsCountryFilter = countryFilterableTypes.has(params.type);
  const supportsCategoryFilter = categoryFilterableTypes.has(params.type);
  const country = supportsCountryFilter ? normalizeCountry(searchParams?.country) : "";
  const category = supportsCategoryFilter ? normalizeCategory(searchParams?.category) : "";
  const activeFilters = { country, category };
  const data = withSignedListImages(await getList(params.type, page, 30, country, category));
  const currentPage = data.page || page;
  const [returnPath, returnSearch = ""] = listHref(params.type, currentPage, activeFilters).split("?");
  const currentReturnTo = createReturnToPath(returnPath, returnSearch ? `?${returnSearch}` : "");

  return (
    <>
      <TopBar />
      <section className="px-4 pt-6">
        <h1 className="text-3xl font-black tracking-tight">{data.title}</h1>
        <p className="mt-1 text-sm text-zinc-400">Trang {currentPage}{data.totalPages ? ` / ${data.totalPages}` : ""}</p>
      </section>

      {supportsCountryFilter || supportsCategoryFilter ? (
        <section className="space-y-3 px-4 pt-4">
          {supportsCountryFilter ? (
            <div aria-label="Lọc nhanh theo quốc gia">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">Quốc gia</p>
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
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">Nhóm phim</p>
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
        {data.items.map((movie, index) => (
          <MovieCard
            key={movie.slug}
            movie={movie}
            compact
            headingLevel={2}
            priority={index === 0}
            deferImage={index >= 9}
            returnTo={currentReturnTo}
          />
        ))}
      </section>

      <Pagination
        currentPage={currentPage}
        totalPages={data.totalPages || 1}
        basePath={`/list/${params.type}`}
        searchParams={searchParams}
      />
    </>
  );
}
