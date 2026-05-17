import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import glsl from 'vite-plugin-glsl';
import path from 'node:path';

// Note on chunking: we deliberately do NOT use manualChunks for three/r3f/tone.
// manualChunks promotes those chunks to <link rel="modulepreload"> in the entry
// HTML, which defeats the lazy-route boundary and forces visitors to /text to
// pull three.js anyway. Letting Rollup code-split purely on dynamic-import
// boundaries keeps three out of the entry preload graph.
export default defineConfig({
  plugins: [react(), glsl()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    manifest: true,
    target: 'es2022',
    sourcemap: true,
  },
  server: {
    port: 5173,
  },
});
