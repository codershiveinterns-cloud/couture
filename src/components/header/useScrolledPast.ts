'use client';

import { useCallback, useSyncExternalStore } from 'react';

function subscribe(onChange: () => void) {
  window.addEventListener('scroll', onChange, { passive: true });
  window.addEventListener('resize', onChange);
  return () => {
    window.removeEventListener('scroll', onChange);
    window.removeEventListener('resize', onChange);
  };
}

const getServerSnapshot = () => false;

/** `true` once the window has scrolled further than `threshold` px (false during SSR). */
export function useScrolledPast(threshold: number): boolean {
  const getSnapshot = useCallback(() => window.scrollY > threshold, [threshold]);
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
