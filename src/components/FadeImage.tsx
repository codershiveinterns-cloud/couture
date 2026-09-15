'use client';

import Image, { type ImageProps } from 'next/image';
import { useState } from 'react';

// Fades the image in once loaded instead of popping in abruptly while
// Wikimedia Commons / Unsplash responds.
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
