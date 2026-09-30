import { ImageResponse } from 'next/og';
import { SITE_NAME, SITE_TAGLINE } from '@/lib/seo';

// Default Open Graph / Twitter card for every route that does not define its own.
// Rendered with the built-in font only: no network fetches, so it works offline and in CI.

export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          background: 'linear-gradient(135deg, #282c3f 0%, #3b4058 100%)',
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div
            style={{
              width: 56,
              height: 56,
              background: '#ff3f6c',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 34,
              fontWeight: 800,
            }}
          >
            C
          </div>
          <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: 6, textTransform: 'uppercase' }}>{SITE_NAME}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ fontSize: 88, fontWeight: 800, lineHeight: 1.02, letterSpacing: -2 }}>Dress for the days ahead.</div>
          <div style={{ fontSize: 34, color: 'rgba(255,255,255,0.82)' }}>{SITE_TAGLINE}</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 24, color: 'rgba(255,255,255,0.7)' }}>
          <div style={{ width: 48, height: 4, background: '#ff3f6c' }} />
          Fast shipping · Easy returns · New drops weekly
        </div>
      </div>
    ),
    { ...size },
  );
}
