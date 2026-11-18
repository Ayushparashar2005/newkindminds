import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  site: 'https://kindminds.org',
  devToolbar: { enabled: false },
  vite: {
    // Pre-bundle deps that are imported lazily (map picker) so the dev server never re-optimizes mid-session
    optimizeDeps: { include: ['react-dom', 'react-dom/client', 'leaflet', 'react-leaflet'] },
  },
  integrations: [
    react(),
    tailwind({
      applyBaseStyles: false,
    }),
  ],
});

