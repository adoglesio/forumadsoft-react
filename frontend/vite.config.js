import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Requisições para /api em dev são repassadas ao backend.
      '/api': {
        target: 'https://forumadsoft-react.vercel.app/api',
        changeOrigin: true,
        secure: true,
      },
    },
  },
});