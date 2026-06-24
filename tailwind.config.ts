import type { Config } from 'tailwindcss';

/**
 * Éclat Grandeur — design tokens.
 *
 * Luxury jewellery palette: ivory/cream grounds, forest green header and
 * accents, warm gold highlights, dark green editorial typography.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Forest green — header, nav, dark sections
        noir: {
          DEFAULT: '#2c3d2e',
          soft: '#3d5240',
          deep: '#1a2519',
        },
        // Ivory / warm cream grounds
        ivory: {
          DEFAULT: '#f5f0e8',
          warm: '#faf7f2',
          deep: '#ede5d8',
        },
        // Warm gold accent
        champagne: {
          DEFAULT: '#b8965a',
          soft: '#d4b07a',
          leaf: '#e8cfa0',
          deep: '#8f6d35',
        },
        // Pale sage tint
        glacier: {
          DEFAULT: '#a8b5a0',
          soft: '#dde5d8',
          deep: '#5a6e55',
        },
        // Dark green text
        ink: {
          DEFAULT: '#2c3d2e',
          soft: '#4a5e4c',
          muted: '#7a8f7c',
        },
        // Sale red
        sale: '#c0392b',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'ui-serif', 'serif'],
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        luxe: '0.16em',
        wide2: '0.26em',
      },
      maxWidth: {
        container: '84rem',
      },
      transitionTimingFunction: {
        luxe: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      boxShadow: {
        luxe: '0 24px 60px -34px rgba(44, 61, 46, 0.35)',
        card: '0 10px 30px -18px rgba(44, 61, 46, 0.25)',
        gold: '0 10px 30px -12px rgba(184, 150, 90, 0.4)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(18px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        sheen: {
          '0%': { transform: 'translateX(-120%) skewX(-18deg)', opacity: '0' },
          '40%': { opacity: '0.65' },
          '100%': { transform: 'translateX(220%) skewX(-18deg)', opacity: '0' },
        },
        twinkle: {
          '0%, 100%': { opacity: '0.15', transform: 'scale(0.7)' },
          '50%': { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'spin-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.9s cubic-bezier(0.22, 1, 0.36, 1) both',
        shimmer: 'shimmer 1.8s linear infinite',
        sheen: 'sheen 4.5s cubic-bezier(0.22, 1, 0.36, 1) infinite',
        twinkle: 'twinkle 3.2s ease-in-out infinite',
        float: 'float 7s ease-in-out infinite',
        'spin-slow': 'spin-slow 22s linear infinite',
        marquee: 'marquee 38s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
