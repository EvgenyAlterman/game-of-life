import { defineConfig } from 'vite';

/**
 * Client-only build configuration
 *
 * This config produces a standalone static build that can be deployed
 * to any static hosting service (S3, Amplify, Netlify, etc.)
 *
 * Output: dist-client/
 *
 * Usage:
 *   npm run build:release    # Build to dist-client/
 *   npm run preview:release  # Preview the release build
 */
export default defineConfig({
  build: {
    outDir: 'dist-client',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: '/index.html',
        explanation: '/explanation.html'
      }
    },
    target: 'es2020',
    sourcemap: false,
    minify: 'esbuild'
  },
  esbuild: {
    target: 'es2020'
  },
  // No server proxy - this is a static build
  preview: {
    port: 4173
  }
});
