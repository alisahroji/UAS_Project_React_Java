import React from 'react';

/**
 * DEVLINK shared brand assets (Step 12+ polish).
 *
 * - LogoMark: the small square app mark (gradient), used compactly.
 * - LogoWordmark: "DEV" (white or dark) + "LINK" (red) — the DEVLINK reference style.
 *   `dark` renders for light backgrounds (dark text), `light` (default) for dark/red ones.
 *
 * IMAGE URLS are Unsplash hotlinks verified reachable (HTTP 200) during implementation:
 * - HERO_BG:      developer workspace / code on screen
 * - LANDING_SIDE: team collaboration scene
 * - AUTH_BG:      laptop with code, moody lighting
 */
export const HERO_BG = 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1600&q=80';
export const LANDING_SIDE = 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1600&q=80';
export const AUTH_BG = 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1600&q=80';

export function LogoMark({ size = 'md' }) {
  const dims = size === 'sm' ? 'w-7 h-7 text-[11px]' : size === 'lg' ? 'w-11 h-11 text-base' : 'w-9 h-9 text-sm';
  return (
    <span
      aria-hidden="true"
      className={`${dims} inline-flex items-center justify-center rounded-lg font-extrabold tracking-tight text-white shrink-0`}
      style={{ background: 'linear-gradient(135deg, #b3151f 0%, #e5484d 100%)' }}
    >
      {'</>'}
    </span>
  );
}

export function LogoWordmark({ variant = 'light', size = 'md' }) {
  const textSize = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-2xl' : 'text-xl';
  const devColor = variant === 'dark' ? '#1c1416' : '#ffffff';
  return (
    <span className={`${textSize} font-extrabold tracking-tight leading-none select-none`}>
      <span style={{ color: devColor }}>DEV</span>
      <span style={{ color: '#e5484d' }}>LINK</span>
    </span>
  );
}
