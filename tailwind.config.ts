import type { Config } from 'tailwindcss';

/**
 * Éclat Grandeur — design tokens.
 *
 * A hybrid luxury language: the cinematic noir of De Beers, the refined serif
 * romance of Tiffany, the clean trustworthy commerce of Blue Nile, and the
 * tech-forward diamond focus of James Allen.
 *
 * Palette
 *  · noir      — cinematic near-black grounds (drama)
 *  · ivory     — warm pearl grounds (clean commerce)
 *  · champagne — gold accent (couture luxury)
 *  · glacier   — cool diamond blue (the "stone" / trust accent)
 *  · ink       — warm near-black text on light
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        noir: {
          DEFAULT: '#100f0d',
          soft: '#1b1815',
          deep: '#0a0908',
        },
        ivory: {
          DEFAULT: '#f6f3ec',
          warm: '#faf7f1',
          deep: '#ece4d6',
        },
        champagne: {
          DEFAULT: '#c3a35c',
          soft: '#dcc189',
          leaf: '#ecdcab',
          deep: '#9b7e3d',
        },
        glacier: {
          DEFAULT: '#9bb7c4',
          soft: '#cbdde4',
          deep: '#2c4a58',
        },
        ink: {
          DEFAULT: '#211d18',
          soft: '#4a443b',
          muted: '#7a7264',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Cormorant Garamond', 'serif'],
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        luxe: '0.2em',
        wide2: '0.32em',
      },
      maxWidth: {
        container: '84rem',
      },
      transitionTimingFunction: {
        luxe: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      boxShadow: {
        luxe: '0 30px 80px -40px rgba(16, 15, 13, 0.55)',
        card: '0 20px 50px -30px rgba(16, 15, 13, 0.4)',
        gold: '0 10px 40px -12px rgba(195, 163, 92, 0.45)',
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
