import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// Note on chunking: we deliberately do NOT use manualChunks for three/r3f/tone.
// manualChunks promotes those chunks to <link rel="modulepreload"> in the entry
// HTML, which defeats the lazy-route boundary and forces visitors to /text to
// pull three.js anyway. Letting Rollup code-split purely on dynamic-import
// boundaries keeps three out of the entry preload graph.
//
// Note on GLSL: we do NOT use vite-plugin-glsl right now. It's broken on Vite 5
// without `@rollup/pluginutils` (a peer dep that isn't auto-installed), which
// causes the plugin's file-extension filter to misbehave and stringify
// modules it shouldn't touch — including `/@react-refresh`, which crashes the
// dev server with a SyntaxError. Phase 1 Checkpoint A doesn't ship any
// shaders, so dropping the plugin is the cheapest fix. When the rain shader
// lands in Checkpoint B (1.18), we'll re-evaluate the GLSL pipeline.
export default defineConfig({
  plugins: [react()],
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
