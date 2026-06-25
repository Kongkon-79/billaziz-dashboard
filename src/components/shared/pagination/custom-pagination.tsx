"use client";

import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";

interface CustomPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  pageSize?: number;
  itemLabel?: string;
  maxVisiblePages?: number;
  className?: string;
}

type PageItem = number | "ellipsis-start" | "ellipsis-end";

const CustomPagination = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize = 10,
  itemLabel = "items",
  maxVisiblePages = 3,
  className,
}: CustomPaginationProps) => {
  const safeTotalPages = Math.max(1, totalPages);
  const safeCurrentPage = Math.min(
    Math.max(1, currentPage),
    safeTotalPages,
  );
  const hasMultiplePages = safeTotalPages > 1;
  const hasItemSummary = typeof totalItems === "number";

  const getPageNumbers = (): PageItem[] => {
    if (safeTotalPages <= maxVisiblePages + 2) {
      return Array.from({ length: safeTotalPages }, (_, index) => index + 1);
    }

    const pages: PageItem[] = [1];
    const half = Math.floor(maxVisiblePages / 2);
    let start = Math.max(2, safeCurrentPage - half);
    const end = Math.min(safeTotalPages - 1, start + maxVisiblePages - 1);

    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(2, end - maxVisiblePages + 1);
    }

    if (start > 2) pages.push("ellipsis-start");
    for (let page = start; page <= end; page += 1) pages.push(page);
    if (end < safeTotalPages - 1) pages.push("ellipsis-end");
    pages.push(safeTotalPages);

    return pages;
  };

  const handlePageChange = (page: number) => {
    const nextPage = Math.min(Math.max(page, 1), safeTotalPages);
    if (nextPage !== safeCurrentPage) onPageChange(nextPage);
  };

  const pageNumbers = getPageNumbers();
  const startItem =
    hasItemSummary && totalItems > 0
      ? (safeCurrentPage - 1) * pageSize + 1
      : 0;
  const endItem = hasItemSummary
    ? Math.min(safeCurrentPage * pageSize, totalItems)
    : 0;

  if (!hasMultiplePages && !hasItemSummary) return null;

  return (
    <div
      className={cn(
        "flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      {hasItemSummary ? (
        <p className="text-center text-sm text-[#68706A] sm:text-left">
          {totalItems === 0 ? (
            <>No {itemLabel} found</>
          ) : (
            <>
              Showing{" "}
              <span className="font-semibold text-[#343A40]">
                {startItem}–{endItem}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-[#343A40]">
                {totalItems}
              </span>{" "}
              {itemLabel}
            </>
          )}
        </p>
      ) : (
        <p className="text-center text-sm text-[#68706A] sm:text-left">
          Page{" "}
          <span className="font-semibold text-[#343A40]">
            {safeCurrentPage}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-[#343A40]">
            {safeTotalPages}
          </span>
        </p>
      )}

      {hasMultiplePages ? (
        <nav aria-label="Pagination" className="flex justify-center sm:justify-end">
          <div className="inline-flex items-center gap-1 rounded-[12px] border border-[#E0E4EC] bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => handlePageChange(safeCurrentPage - 1)}
              disabled={safeCurrentPage === 1}
              className="flex h-9 items-center justify-center gap-1 rounded-[8px] px-2.5 text-sm font-medium text-[#68706A] transition hover:bg-[#FFF0E6] hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[#68706A]"
              aria-label="Go to previous page"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden md:inline">Previous</span>
            </button>

            <div className="flex items-center gap-1">
              {pageNumbers.map((page) => {
                if (typeof page !== "number") {
                  return (
                    <span
                      key={page}
                      className="flex h-9 w-8 items-center justify-center text-[#9CA3AF]"
                      aria-hidden="true"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </span>
                  );
                }

                const isActive = page === safeCurrentPage;

                return (
                  <button
                    key={page}
                    type="button"
                    onClick={() => handlePageChange(page)}
                    className={cn(
                      "flex h-9 min-w-9 items-center justify-center rounded-[8px] px-2 text-sm font-semibold transition",
                      isActive
                        ? "bg-primary text-white shadow-sm"
                        : "text-[#68706A] hover:bg-[#FFF0E6] hover:text-primary",
                    )}
                    aria-label={`Go to page ${page}`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => handlePageChange(safeCurrentPage + 1)}
              disabled={safeCurrentPage === safeTotalPages}
              className="flex h-9 items-center justify-center gap-1 rounded-[8px] px-2.5 text-sm font-medium text-[#68706A] transition hover:bg-[#FFF0E6] hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[#68706A]"
              aria-label="Go to next page"
            >
              <span className="hidden md:inline">Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </nav>
      ) : null}
    </div>
  );
};

export default CustomPagination;
