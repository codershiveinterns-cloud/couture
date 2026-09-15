'use client';

import { useScrolledPast } from '@/components/header/useScrolledPast';

/** Circular "scroll to top" button that appears once the page has scrolled 600px. */
export default function BackToTop() {
  const visible = useScrolledPast(600);

  const scrollToTop = () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Back to top"
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
      className={`fixed bottom-5 right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full border-2 border-brand bg-white text-brand shadow-[0_4px_16px_rgba(40,44,63,0.15)] transition-[opacity,transform,background-color,color] duration-200 ease-out hover:bg-brand hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 motion-reduce:transition-none sm:right-6 lg:bottom-8 lg:right-8 lg:h-12 lg:w-12 ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'
      }`}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 19V5" />
        <path d="M5 12l7-7 7 7" />
      </svg>
    </button>
  );
}
