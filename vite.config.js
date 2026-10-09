/*
 * Vite setup: React compilation, local API middleware for dev/preview, and vendor chunk grouping for builds.
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { openAIProxy } from './server/openai-proxy.js';

export default defineConfig({
  plugins: [react(), {
    name: 'aura-server-api',
    configureServer(server) { server.middlewares.use(openAIProxy()); },
    configurePreviewServer(server) { server.middlewares.use(openAIProxy()); },
  }],
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        // Group dependencies by package family to separate application code from large vendors.
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react')) return 'vendor';
            if (id.includes('firebase')) return 'firebase';
            if (id.includes('lucide-react') || id.includes('framer-motion')) return 'ui';
            if (id.includes('three')) return 'three';
          }
          return null;
        },
      },
    },
  },
});
