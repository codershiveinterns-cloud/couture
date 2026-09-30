'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import FadeImage from '@/components/FadeImage';

export interface HeroSlide {
  src: string;
  alt: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  href: string;
  /** Optional secondary (outline) CTA. */
  secondaryLabel?: string;
  secondaryHref?: string;
}

const AUTO_ADVANCE_MS = 6000;
const SWIPE_THRESHOLD_PX = 40;

export default function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  // Bumped on every manual navigation so the progress bar restarts from zero.
  const [cycle, setCycle] = useState(0);
  const pointerStart = useRef<{ x: number; y: number; id: number } | null>(null);
  const count = slides.length;

  const goTo = useCallback(
    (i: number) => {
      if (count === 0) return;
      setIndex(((i % count) + count) % count);
      setCycle((c) => c + 1);
    },
    [count],
  );

  useEffect(() => {
    if (paused || count <= 1) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % count);
      setCycle((c) => c + 1);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(timer);
  }, [paused, count, cycle]);

  if (count === 0) return null;

  const onKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goTo(index - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      goTo(index + 1);
    }
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    pointerStart.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const start = pointerStart.current;
    pointerStart.current = null;
    if (!start || start.id !== e.pointerId) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) < SWIPE_THRESHOLD_PX || Math.abs(dx) < Math.abs(dy)) return;
    goTo(dx < 0 ? index + 1 : index - 1);
  };

  const onPointerCancel = () => {
    pointerStart.current = null;
  };

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured collections"
      className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={onKeyDown}
    >
      <div
        className="relative touch-pan-y select-none overflow-hidden rounded-sm bg-ink"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      >
        <div className="relative aspect-[4/5] w-full sm:aspect-[16/9] lg:aspect-[21/9]">
          {slides.map((slide, i) => {
            const active = i === index;
            return (
              <div
                key={slide.src}
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${count}`}
                aria-hidden={!active}
                className={`absolute inset-0 transition-opacity duration-700 ease-out ${
                  active ? 'z-10 opacity-100' : 'z-0 opacity-0'
                }`}
              >
                {/* Ken-Burns: the active image drifts from 1 → 1.06 over the slide's lifetime. */}
                <div
                  className={`absolute inset-0 motion-safe:transition-transform motion-safe:duration-[6000ms] motion-safe:ease-linear ${
                    active ? 'motion-safe:scale-[1.06]' : 'motion-safe:scale-100'
                  }`}
                >
                  <FadeImage
                    src={slide.src}
                    alt={slide.alt}
                    fill
                    priority={i === 0}
                    draggable={false}
                    sizes="(min-width: 1280px) 1280px, 100vw"
                    className="object-cover"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-ink/85 via-ink/45 to-ink/10 sm:to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent sm:hidden" />

                <div className="absolute inset-0 flex items-end sm:items-center">
                  <div
                    key={active ? 'active' : 'idle'}
                    className={`max-w-xl px-5 pb-16 sm:px-10 sm:pb-0 lg:px-14 ${active ? 'animate-fade-in-up' : ''}`}
                  >
                    <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/80 sm:text-xs">
                      {slide.eyebrow}
                    </p>
                    <h2 className="mt-3 text-[40px] font-extrabold leading-[1.02] tracking-tight text-white sm:text-[56px] lg:text-[64px]">
                      {slide.title}
                    </h2>
                    <p className="mt-3 max-w-md text-[14px] leading-relaxed text-white/85 sm:mt-4 sm:text-[16px]">
                      {slide.subtitle}
                    </p>
                    <div className="mt-5 flex flex-wrap items-center gap-3 sm:mt-7">
                      <Link
                        href={slide.href}
                        tabIndex={active ? 0 : -1}
                        className="inline-flex h-11 items-center rounded-sm bg-brand px-6 text-[13px] font-bold uppercase tracking-wide text-white transition-colors duration-150 hover:bg-brand-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-white sm:h-12 sm:text-sm"
                      >
                        {slide.ctaLabel}
                      </Link>
                      {slide.secondaryLabel && slide.secondaryHref && (
                        <Link
                          href={slide.secondaryHref}
                          tabIndex={active ? 0 : -1}
                          className="inline-flex h-11 items-center rounded-sm border-2 border-white/90 px-6 text-[13px] font-bold uppercase tracking-wide text-white transition-colors duration-150 hover:bg-white hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-white sm:h-12 sm:text-sm"
                        >
                          {slide.secondaryLabel}
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {count > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous slide"
              onClick={() => goTo(index - 1)}
              className="absolute left-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-sm bg-white/90 text-ink shadow-[0_2px_8px_rgba(40,44,63,0.15)] transition-colors duration-150 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 sm:flex"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Next slide"
              onClick={() => goTo(index + 1)}
              className="absolute right-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-sm bg-white/90 text-ink shadow-[0_2px_8px_rgba(40,44,63,0.15)] transition-colors duration-150 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 sm:flex"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <div
              role="tablist"
              aria-label="Choose slide"
              className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2"
            >
              {slides.map((slide, i) => (
                <button
                  key={slide.src}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={`Go to slide ${i + 1}`}
                  onClick={() => goTo(i)}
                  className="group flex h-6 min-w-6 items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <span
                    aria-hidden="true"
                    className={`block h-2 rounded-full transition-all duration-200 ${
                      i === index ? 'w-6 bg-white' : 'w-2 bg-white/55 group-hover:bg-white/80'
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Slide progress: refills from 0 → 100% over the auto-advance interval. */}
            <div aria-hidden className="absolute inset-x-0 bottom-0 z-20 h-[3px] bg-white/20">
              <div
                key={`${index}-${cycle}-${paused}`}
                className="h-full bg-brand motion-safe:animate-[hero-progress_6s_linear_forwards] motion-reduce:w-full"
                style={{ animationPlayState: paused ? 'paused' : 'running' }}
              />
              <style>{`@keyframes hero-progress{from{width:0%}to{width:100%}}`}</style>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
