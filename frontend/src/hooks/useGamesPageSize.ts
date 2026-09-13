import { useEffect, useState } from "react";

export const COMPACT_GAMES_PAGE_SIZE = 12;
export const WIDE_GAMES_PAGE_SIZE = 15;

const wideViewportQuery = "(min-width: 1024px)";

function isWideViewport() {
  return typeof window !== "undefined" &&
    window.matchMedia(wideViewportQuery).matches;
}

export function useGamesPageSize(widePageSize = WIDE_GAMES_PAGE_SIZE) {
  const [pageSize, setPageSize] = useState(() =>
    isWideViewport() ? widePageSize : COMPACT_GAMES_PAGE_SIZE,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia(wideViewportQuery);
    const updatePageSize = (event: MediaQueryListEvent) => {
      setPageSize(event.matches ? widePageSize : COMPACT_GAMES_PAGE_SIZE);
    };

    mediaQuery.addEventListener("change", updatePageSize);
    return () => mediaQuery.removeEventListener("change", updatePageSize);
  }, [widePageSize]);

  return pageSize;
}
