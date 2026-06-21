import type { Config } from 'tailwindcss';

/**
 * Éclat Grandeur design tokens.
 * Palette: ivory ground (primary) · deep forest green (secondary) · champagne-gold accent.
 * Typography pairs a serif display (Cormorant) with a clean sans (body).
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#162b1e',
          soft: '#243d2e',
        },
        ivory: {
          DEFAULT: '#f7f3ec',
          deep: '#efe8db',
        },
        champagne: {
          DEFAULT: '#c4a35a',
          soft: '#d8c08a',
          deep: '#a3833f',
        },
        stone: {
          DEFAULT: '#8a8174',
          light: '#bdb5a6',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Cormorant Garamond', 'serif'],
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        luxe: '0.18em',
      },
      maxWidth: {
        container: '80rem',
      },
      transitionTimingFunction: {
        luxe: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.8s cubic-bezier(0.22, 1, 0.36, 1) both',
        shimmer: 'shimmer 1.6s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
