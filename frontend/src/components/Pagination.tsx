import React from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange
}) => {
  if (totalPages <= 1) return null;

  function getPageRange(currentPage: number, totalPages: number) {
    const delta = 2;
    const range = [];
    const rangeWithDots: (string | number)[] = [];
    let l: number | undefined;

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        range.push(i);
      }
    }

    for (let i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l > 2) {
          rangeWithDots.push("...");
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  }

  const pageItems = getPageRange(currentPage, totalPages);

  return (
    <div className="flex items-center justify-between border-t border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3 sm:px-6 mt-8">
      <div className="flex flex-1 justify-between sm:justify-end">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="relative inline-flex items-center rounded-md bg-[hsl(var(--card))] px-3 py-2 text-sm font-semibold text-[hsl(var(--foreground))] ring-1 ring-inset ring-[hsl(var(--input))] hover:bg-[hsl(var(--accent))] focus-visible:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>

        <div className="hidden sm:flex space-x-1 mx-4">
          {pageItems.map((page, idx) =>
            page === "..." ? (
              <span
                key={`dots-${idx}`}
                className="flex items-center px-2 text-[hsl(var(--muted-foreground))]"
              >
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page as number)}
                className={`relative inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold ring-1 ring-inset ${
                  page === currentPage
                    ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] ring-[hsl(var(--primary))]"
                    : "bg-[hsl(var(--card))] text-[hsl(var(--foreground))] ring-[hsl(var(--input))] hover:bg-[hsl(var(--accent))]"
                }`}
                aria-current={page === currentPage ? "page" : undefined}
              >
                {page}
              </button>
            )
          )}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="relative inline-flex items-center rounded-md bg-[hsl(var(--card))] px-3 py-2 text-sm font-semibold text-[hsl(var(--foreground))] ring-1 ring-inset ring-[hsl(var(--input))] hover:bg-[hsl(var(--accent))] focus-visible:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
};
