'use client';

import { useRef, useState, type KeyboardEvent } from 'react';
import type { ProductImage } from '@/lib/types';
import FadeImage from './FadeImage';

function Placeholder() {
  return (
    <div className="flex aspect-[3/4] w-full items-center justify-center rounded-sm bg-surface text-sm text-ink-4">
      No image
    </div>
  );
}

function ChevronIcon({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d={dir === 'left' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const LIGHTBOX_BTN =
  'flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-ink shadow-[0_1px_4px_rgba(0,0,0,0.25)] transition-colors duration-150 hover:bg-white outline-none focus-visible:ring-2 focus-visible:ring-brand/40';

/**
 * Myntra-style gallery: a 2×2 grid of large portrait images on tablet/desktop,
 * a horizontal snap carousel with dots on mobile. Clicking any image opens a
 * full-screen lightbox with prev/next, Escape and backdrop close.
 */
export default function ProductGallery({ images, name }: { images: ProductImage[]; name: string }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  if (images.length === 0) return <Placeholder />;

  const count = images.length;

  const handleScroll = () => {
    const track = trackRef.current;
    if (!track) return;
    const idx = Math.round(track.scrollLeft / track.clientWidth);
    if (idx !== activeIdx) setActiveIdx(Math.max(0, Math.min(count - 1, idx)));
  };

  const goTo = (idx: number) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: idx * track.clientWidth, behavior: 'smooth' });
  };

  // Scroll lock lives in the open/close handlers (not an effect) so the body
  // class always mirrors the user's action.
  const openLightbox = (idx: number, opener: HTMLElement | null) => {
    openerRef.current = opener;
    document.body.classList.add('overflow-hidden');
    setLightboxIdx(idx);
    // Move focus into the dialog once it has rendered.
    requestAnimationFrame(() => closeRef.current?.focus());
  };

  const closeLightbox = () => {
    document.body.classList.remove('overflow-hidden');
    setLightboxIdx(null);
    const opener = openerRef.current;
    openerRef.current = null;
    requestAnimationFrame(() => opener?.focus());
  };

  const step = (delta: number) => {
    setLightboxIdx((cur) => (cur === null ? cur : (cur + delta + count) % count));
  };

  const onLightboxKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeLightbox();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      step(1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      step(-1);
    }
  };

  const current = lightboxIdx === null ? null : images[lightboxIdx];

  return (
    <div>
      {/* Mobile: swipe carousel */}
      <div className="sm:hidden">
        <div
          ref={trackRef}
          onScroll={handleScroll}
          role="region"
          aria-roledescription="carousel"
          aria-label={`${name} images`}
          className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {images.map((img, idx) => (
            <div
              key={img.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${idx + 1} of ${count}`}
              className="relative aspect-[3/4] w-full shrink-0 snap-start overflow-hidden rounded-sm bg-surface"
            >
              <button
                type="button"
                onClick={(e) => openLightbox(idx, e.currentTarget)}
                aria-label={`Open image ${idx + 1} full screen`}
                className="absolute inset-0 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/40"
              >
                <FadeImage
                  src={img.url}
                  alt={img.altText || name}
                  fill
                  priority={idx === 0}
                  sizes="100vw"
                  className="object-cover"
                />
              </button>
            </div>
          ))}
        </div>
        {count > 1 && (
          <div className="mt-3 flex justify-center gap-1.5" aria-label="Choose image">
            {images.map((img, idx) => (
              <button
                key={img.id}
                type="button"
                onClick={() => goTo(idx)}
                aria-label={`Go to image ${idx + 1}`}
                aria-current={idx === activeIdx ? 'true' : undefined}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  idx === activeIdx ? 'w-5 bg-brand' : 'w-1.5 bg-line-strong hover:bg-ink-4'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Tablet/desktop: 2×2 grid */}
      <div className="hidden grid-cols-2 gap-1.5 sm:grid">
        {images.map((img, idx) => (
          <button
            key={img.id}
            type="button"
            onClick={(e) => openLightbox(idx, e.currentTarget)}
            aria-label={`Open image ${idx + 1} full screen`}
            className={`group relative aspect-[3/4] cursor-zoom-in overflow-hidden rounded-sm bg-surface outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${
              count === 1 ? 'col-span-2 aspect-[4/3]' : ''
            }`}
          >
            <FadeImage
              src={img.url}
              alt={img.altText || name}
              fill
              priority={idx < 2}
              sizes="(min-width: 1024px) 30vw, 45vw"
              className="object-cover transition-transform duration-300 ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {current && lightboxIdx !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${name} image ${lightboxIdx + 1} of ${count}`}
          onKeyDown={onLightboxKey}
          onClick={closeLightbox}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 animate-fade-in sm:p-8"
        >
          <button
            ref={closeRef}
            type="button"
            onClick={closeLightbox}
            aria-label="Close"
            className={`${LIGHTBOX_BTN} absolute right-4 top-4 z-10`}
          >
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>

          {count > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  step(-1);
                }}
                aria-label="Previous image"
                className={`${LIGHTBOX_BTN} absolute left-3 top-1/2 z-10 -translate-y-1/2 sm:left-6`}
              >
                <ChevronIcon dir="left" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  step(1);
                }}
                aria-label="Next image"
                className={`${LIGHTBOX_BTN} absolute right-3 top-1/2 z-10 -translate-y-1/2 sm:right-6`}
              >
                <ChevronIcon dir="right" />
              </button>
            </>
          )}

          <div
            key={current.id}
            onClick={(e) => e.stopPropagation()}
            className="relative h-full max-h-[90vh] w-full max-w-[min(90vw,calc(90vh*0.75))] animate-fade-in"
          >
            <FadeImage src={current.url} alt={current.altText || name} fill sizes="90vw" className="object-contain" />
          </div>

          <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/90 px-3 py-1 text-[12px] font-bold text-ink">
            {lightboxIdx + 1} / {count}
          </span>
        </div>
      )}
    </div>
  );
}
