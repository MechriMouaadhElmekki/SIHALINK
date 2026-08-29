import { ImageResponse } from 'next/og';

export const runtime = 'edge';

/**
 * Next.js App Router apple-icon file.
 * Auto-served at /apple-icon.png and registered in <head> as
 * <link rel="apple-touch-icon">.
 *
 * iOS requires PNG — SVG is silently ignored for home screen icons.
 * This replaces the manual <link rel="apple-touch-icon" href="/icons/icon-192.svg">
 * that was removed from layout.tsx.
 */
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1e3a5f',
          // No borderRadius — iOS applies its own squircle mask
        }}
      >
        {/* Vertical bar */}
        <div
          style={{
            position: 'absolute',
            width: 20,
            height: 110,
            background: '#2563eb',
            borderRadius: 10,
          }}
        />
        {/* Horizontal bar */}
        <div
          style={{
            position: 'absolute',
            width: 110,
            height: 20,
            background: '#2563eb',
            borderRadius: 10,
          }}
        />
        {/* Circle ring */}
        <div
          style={{
            position: 'absolute',
            width: 62,
            height: 62,
            borderRadius: '50%',
            border: '6px solid #60a5fa',
            background: 'transparent',
          }}
        />
      </div>
    ),
    { ...size }
  );
}
