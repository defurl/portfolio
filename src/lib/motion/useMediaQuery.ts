import { useEffect, useState } from 'react';

// Generic media-query hook. Returns true when the query currently matches.
// SSR-safe — defaults to false until mounted.
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mq = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

/** Convenience: viewport ≤ 768px (the mobile-variant threshold per 1.21). */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 768px)');
}
