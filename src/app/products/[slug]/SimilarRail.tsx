'use client';

import { useRef, type ReactNode } from 'react';

const ARROW =
  'flex h-9 w-9 items-center justify-center rounded-full border border-line-strong bg-white text-ink transition-colors duration-150 hover:border-ink outline-none focus-visible:ring-2 focus-visible:ring-brand/40';

/**
 * Horizontal snap rail for the "Similar products" section. Swipe on touch,
 * left/right buttons on desktop scroll the track by ~one viewport.
 */
export default function SimilarRail({ children }: { children: ReactNode }) {
  const trackRef = useRef<HTMLDivElement | null>(null);

  const scrollByPage = (dir: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: dir * track.clientWidth * 0.8, behavior: 'smooth' });
  };

  return (
    <div>
      <div className="mb-5 hidden justify-end gap-2 sm:flex">
        <button type="button" onClick={() => scrollByPage(-1)} aria-label="Scroll similar products left" className={ARROW}>
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button type="button" onClick={() => scrollByPage(1)} aria-label="Scroll similar products right" className={ARROW}>
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      <div
        ref={trackRef}
        role="region"
        aria-label="Similar products"
        tabIndex={0}
        className="-mx-4 mt-5 flex snap-x gap-3 overflow-x-auto px-4 pb-3 outline-none [-ms-overflow-style:none] [scrollbar-width:none] focus-visible:ring-2 focus-visible:ring-brand/40 sm:mx-0 sm:mt-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
    </div>
  );
}
