import { defineConfig } from 'vite';

// Port 5174 to avoid clashing with sibling Nightshift on 5173.
// base './' keeps the build portable for GitHub Pages.
export default defineConfig({
  base: './',
  server: {
    host: true,
    port: 5174,
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
    sourcemap: false,
    assetsInlineLimit: 0,
  },
});
