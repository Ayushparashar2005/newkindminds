/** @type {import('tailwindcss').Config} */
// Visual language follows the khe design system (ds.khe.money): paper and ink,
// a 12-step "sand" neutral ramp, hairline borders, three radii (badge 6 / control 8
// / card 12), Inter for text, Geist Mono for numbers, yellow only as a highlighter.
// Token names are kept from the original theme so every component picks it up:
//   surface → paper   charcoal → ink   terracotta → ink (primary actions)
//   dustyblue → khe "guide" blue   sand → khe yellow highlighter
//   sage → success green   emergency → red (life-safety only)
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#FDFDFC', // sand-1  page
          raised: '#F9F9F8',  // sand-2  subtle
          inset: '#F1F0EF',   // sand-3  hover
          card: '#FFFFFF',    // surface
          muted: '#E9E8E6',   // sand-4
        },
        charcoal: {
          DEFAULT: '#21201C', // sand-12 ink
          dark: '#111110',
          light: '#3B3A37',
          muted: '#63635E',   // sand-11 secondary text
        },
        terracotta: {
          DEFAULT: '#21201C',
          hover: '#3A3935',
          light: '#F1F0EF',
          dark: '#21201C',
        },
        dustyblue: {
          DEFAULT: '#0267C7',
          hover: '#004B97',
          light: '#E1F0FF',
          dark: '#004B97',
        },
        sage: {
          DEFAULT: '#2F7A4B',
          hover: '#256139',
          light: '#E3F1E7',
          dark: '#1D4D2F',
        },
        sand: {
          DEFAULT: '#FFE556',
          hover: '#F0D43A',
          light: '#FFF6C8',
          dark: '#655406',
        },
        emergency: {
          DEFAULT: '#C4122F',
          soft: '#FCE4E7',
          hover: '#A30E27',
        },
        // Tailwind's stone ramp is replaced by the khe sand ramp
        stone: {
          50: '#F9F9F8',
          100: '#F1F0EF',
          200: '#E9E8E6',
          300: '#DAD9D6',
          400: '#BCBBB5',
          500: '#8D8D86',
          600: '#63635E',
          700: '#3B3A37',
          800: '#2A2A28',
          900: '#21201C',
        },
      },
      boxShadow: {
        'neu-raised': 'none',
        'neu-raised-sm': 'none',
        'neu-inset': 'none',
        'neu-inset-sm': 'none',
        'neu-flat': 'none',
        sm: 'none',
        DEFAULT: 'none',
        md: '0 12px 32px -12px rgba(0,0,0,0.22), 0 2px 6px rgba(0,0,0,0.06)',
        lg: '0 12px 32px -12px rgba(0,0,0,0.22), 0 2px 6px rgba(0,0,0,0.06)',
        xl: '0 24px 60px -20px rgba(0,0,0,0.35)',
        '2xl': '0 24px 60px -20px rgba(0,0,0,0.35)',
      },
      borderRadius: {
        DEFAULT: '6px',
        md: '8px',
        lg: '8px',
        xl: '12px',
        '2xl': '12px',
        '3xl': '16px',
      },
      fontWeight: {
        extrabold: '600',
        black: '700',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
