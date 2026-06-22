import type { Config } from 'tailwindcss';

/**
 * Blue Nile — design tokens.
 *
 * A clean, trustworthy diamond-commerce language: white grounds, a signature
 * cyan/navy "Nile" blue, crisp sans-serif type and confident product imagery.
 * The semantic token NAMES are kept stable so the whole component library
 * re-skins at once; only the VALUES move from the old warm-luxury palette to
 * Blue Nile's blue/white/navy system.
 *
 * Palette
 *  · noir      → deep navy grounds (footers, dark bands)
 *  · ivory     → white / cool off-white grounds (clean commerce)
 *  · champagne → the signature "Nile" blue accent (links, CTAs, prices)
 *  · glacier   → soft diamond blue (tints, chips, halos)
 *  · ink       → navy-charcoal text on white
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // dark navy grounds
        noir: {
          DEFAULT: '#0a2540',
          soft: '#143656',
          deep: '#06182b',
        },
        // white / cool off-white grounds
        ivory: {
          DEFAULT: '#ffffff',
          warm: '#f5f9fc',
          deep: '#e7eef5',
        },
        // the signature Nile blue accent (was "champagne" gold)
        champagne: {
          DEFAULT: '#1a86c2',
          soft: '#4aa6d8',
          leaf: '#8fcdec',
          deep: '#0f6aa6',
        },
        // soft diamond blue
        glacier: {
          DEFAULT: '#7fb4d6',
          soft: '#d7e8f3',
          deep: '#1d4e6e',
        },
        // navy-charcoal text
        ink: {
          DEFAULT: '#13283c',
          soft: '#3c5066',
          muted: '#6b7d8f',
        },
        // antique gold — luxury selector accent (not the Nile blue)
        gold: {
          DEFAULT: '#b8965a',
          soft: '#d4b48a',
          deep: '#8a6e3c',
        },
        // commerce signal red (sale / price drops)
        sale: '#c8102e',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Montserrat', 'ui-sans-serif', 'sans-serif'],
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
        luxe: '0 24px 60px -34px rgba(10, 37, 64, 0.45)',
        card: '0 10px 30px -18px rgba(10, 37, 64, 0.35)',
        gold: '0 10px 30px -12px rgba(26, 134, 194, 0.4)',
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
