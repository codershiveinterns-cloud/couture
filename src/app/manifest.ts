import type { MetadataRoute } from 'next';
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE } from '@/lib/seo';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} — ${SITE_TAGLINE}`,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#ffffff',
    theme_color: '#ff3f6c',
    categories: ['shopping', 'lifestyle'],
    icons: [
      { src: '/icon.png', sizes: '64x64', type: 'image/png' },
      { src: '/apple-icon.png', sizes: '180x180', type: 'image/png', purpose: 'any' },
      { src: '/apple-icon.png', sizes: '180x180', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
