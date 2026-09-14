'use client';

import Image, { type ImageProps } from 'next/image';
import { useState } from 'react';

// Thin wrapper around next/image that fades the image in once it has
// actually loaded, instead of popping in abruptly (or sitting on a flat
// gray box while picsum.photos responds).
export default function FadeImage({ className, alt, ...rest }: ImageProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <Image
      {...rest}
      alt={alt}
      className={`${className || ''} transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      onLoad={() => setLoaded(true)}
    />
  );
}
