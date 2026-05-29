import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: { main: './index.html' },
      output: {
        manualChunks: {
          concierge: ['./js/screens/concierge.js'],
          ar:        ['./js/screens/ar.js'],
          tracking:  ['./js/screens/tracking.js'],
        },
      },
    },
  },
  server: { port: 5173 },
});
