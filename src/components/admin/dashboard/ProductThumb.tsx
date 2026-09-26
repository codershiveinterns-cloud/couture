import Image from 'next/image';
import { isAllowedImageUrl } from '@/lib/services/catalogStore';

/** Small square product thumbnail; falls back to a neutral tile when there is no renderable image. */
export function ProductThumb({ url, size = 40 }: { url: string | null | undefined; size?: number }) {
  return (
    <span className="relative block shrink-0 overflow-hidden rounded-sm border border-line bg-surface" style={{ width: size, height: size }}>
      {url && isAllowedImageUrl(url) && <Image src={url} alt="" fill sizes={`${size}px`} className="object-cover" />}
    </span>
  );
}

export default ProductThumb;
