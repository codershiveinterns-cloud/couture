'use client';

import { useState } from 'react';
import type { ProductImage } from '@/lib/types';
import FadeImage from './FadeImage';

export default function ProductGallery({ images, name }: { images: ProductImage[]; name: string }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const active = images[activeIdx];

  return (
    <div className="flex flex-col gap-3 sm:flex-row-reverse">
      <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-stone-100 shadow-sm sm:flex-1">
        {active ? (
          <FadeImage
            key={active.id}
            src={active.url}
            alt={active.altText || name}
            fill
            priority
            sizes="(min-width: 1024px) 40vw, 90vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-ink/30">No image</div>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto sm:w-20 sm:flex-col sm:overflow-visible">
          {images.map((img, idx) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActiveIdx(idx)}
              aria-label={`View image ${idx + 1}`}
              className={`relative aspect-square w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-colors duration-200 sm:w-full ${
                idx === activeIdx ? 'border-brand' : 'border-transparent opacity-70 hover:border-ink/20 hover:opacity-100'
              }`}
            >
              <FadeImage src={img.url} alt={img.altText || name} fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
