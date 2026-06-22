import Link from "next/link";

type Props = {
  currentPage: number;
  totalPages: number;
  basePath: string;
  searchParams: Record<string, string | string[] | undefined>;
};

export function Pagination({ currentPage, totalPages, basePath, searchParams }: Props) {

  const buildHref = (page: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams || {})) {
      if (key === "page") continue;
      if (value === undefined) continue;
      if (Array.isArray(value)) {
        value.forEach((v) => params.append(key, String(v)));
      } else {
        params.set(key, String(value));
      }
    }
    params.set("page", String(page));
    return `${basePath}?${params.toString()}`;
  };

  const pages = new Set<number>();
  pages.add(1);
  pages.add(totalPages);
  pages.add(currentPage);

  for (let i = 1; i <= 2; i++) {
    if (currentPage - i > 1) pages.add(currentPage - i);
    if (currentPage + i < totalPages) pages.add(currentPage + i);
  }

  const sortedPages = Array.from(pages).sort((a, b) => a - b);
  const result: (number | string)[] = [];

  for (let i = 0; i < sortedPages.length; i++) {
    result.push(sortedPages[i]);
    if (i < sortedPages.length - 1) {
      const current = sortedPages[i];
      const next = sortedPages[i + 1];
      const gap = next - current;

      if (gap === 2) {
        result.push(current + 1);
      } else if (gap > 2) {
        result.push("...");
      }
    }
  }

  return (
    <nav aria-label="Pagination" className="flex justify-center items-center gap-[2px] sm:gap-[4px] py-8">
      {result.map((item, index) => {
        if (item === "...") {
          return (
            <span
              key={`ellipsis-${index}`}
              aria-hidden="true"
              className="grid place-items-center h-[32px] w-[12px] sm:h-[40px] sm:w-[40px] text-[12px] sm:text-[14px] text-[#89868e] font-[600] tracking-[0.04em] sm:tracking-[0.083em]"
            >
              &hellip;
            </span>
          );
        }

        const pageNum = item as number;
        const distance = Math.abs(pageNum - currentPage);
        const isActive = distance === 0;
        const isAdjacent = distance === 1;

        let className =
          "grid place-items-center rounded-[8px] font-[600] tracking-[0.04em] sm:tracking-[0.083em] transition-colors ";

        if (isActive) {
          className +=
            "h-[48px] min-w-[36px] text-[18px] sm:h-[60px] sm:min-w-[60px] sm:text-[21px] bg-[#3d6a99] text-[#ffffff] shadow-[inset_0_0_0_1px_#71b8f2]";
        } else if (isAdjacent) {
          className +=
            "h-[38px] min-w-[29px] text-[14px] sm:h-[48px] sm:min-w-[48px] sm:text-[17px] text-[#ffffff] bg-transparent hover:bg-[rgba(255,255,255,0.05)]";
        } else {
          className +=
            "h-[32px] min-w-[24px] text-[12px] sm:h-[40px] sm:min-w-[40px] sm:text-[14px] text-[#b8b6bb] bg-transparent hover:bg-[rgba(255,255,255,0.05)]";
        }

        return (
          <Link
            key={pageNum}
            href={buildHref(pageNum)}
            aria-current={isActive ? "page" : undefined}
            className={className}
          >
            {pageNum}
          </Link>
        );
      })}
    </nav>
  );
}
