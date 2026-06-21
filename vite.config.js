import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GLSL is imported via Vite's native `?raw` suffix — no extra plugin needed.
export default defineConfig({
  plugins: [react()],
  server: { open: true },
});
