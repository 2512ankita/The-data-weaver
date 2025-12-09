import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [tailwindcss()],
  test: {
    globals: true,
    environment: 'node',
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'chart': ['chart.js'], // Separate Chart.js into its own chunk
        },
      },
    },
    chunkSizeWarningLimit: 600, // Increase limit for Chart.js
  },
});
