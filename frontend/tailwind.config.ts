/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#F5F0E8',
          raised: '#EDE8DF',
          inset: '#DDD8CF',
          card: '#F8F4EE',
          muted: '#E6E0D5',
        },
        charcoal: {
          DEFAULT: '#2C2824',
          dark: '#1A1816',
          light: '#4A443E',
          muted: '#736B63',
        },
        terracotta: {
          DEFAULT: '#B5674D',
          hover: '#9E553D',
          light: '#EEDDD8',
          dark: '#7D3B26',
        },
        dustyblue: {
          DEFAULT: '#5C7A8E',
          hover: '#4C6779',
          light: '#DCE5EB',
          dark: '#384E5D',
        },
        sage: {
          DEFAULT: '#7A9B82',
          hover: '#66846D',
          light: '#E2EBE4',
          dark: '#48634E',
        },
        sand: {
          DEFAULT: '#C9A96E',
          hover: '#B59458',
          light: '#F4EEDA',
          dark: '#82683A',
        },
        emergency: {
          DEFAULT: '#C0392B',
          soft: '#FADBD8',
          hover: '#A93226',
        },
      },
      boxShadow: {
        'neu-raised': '6px 6px 14px #D3CDC2, -6px -6px 14px #FFFFFF',
        'neu-raised-sm': '3px 3px 8px #D3CDC2, -3px -3px 8px #FFFFFF',
        'neu-inset': 'inset 4px 4px 8px #D3CDC2, inset -4px -4px 8px #FFFFFF',
        'neu-inset-sm': 'inset 2px 2px 5px #D3CDC2, inset -2px -2px 5px #FFFFFF',
        'neu-flat': '2px 2px 6px #D8D2C7, -2px -2px 6px #FFFFFF',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
};

