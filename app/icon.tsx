import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const size = { width: 512, height: 512 };
export const contentType = 'image/png';

/**
 * Next.js App Router icon file.
 * Auto-served at /icon.png and registered in <head> as <link rel="icon">.
 * Generates a PNG at build/request time — no binary file needed in repo.
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 512,
          height: 512,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1e3a5f',
          borderRadius: 100,
        }}
      >
        {/* Vertical bar of the cross */}
        <div
          style={{
            position: 'absolute',
            width: 56,
            height: 312,
            background: '#2563eb',
            borderRadius: 28,
          }}
        />
        {/* Horizontal bar of the cross */}
        <div
          style={{
            position: 'absolute',
            width: 312,
            height: 56,
            background: '#2563eb',
            borderRadius: 28,
          }}
        />
        {/* Circle ring */}
        <div
          style={{
            position: 'absolute',
            width: 176,
            height: 176,
            borderRadius: '50%',
            border: '16px solid #60a5fa',
            background: 'transparent',
          }}
        />
      </div>
    ),
    { ...size }
  );
}
