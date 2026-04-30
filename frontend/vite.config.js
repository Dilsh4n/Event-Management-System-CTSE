import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/users':         { target: 'http://localhost:8001', changeOrigin: true },
      '/auth':          { target: 'http://localhost:8001', changeOrigin: true },
      '/admin':         { target: 'http://localhost:8001', changeOrigin: true },
      '/events':        { target: 'http://localhost:8002', changeOrigin: true },
      '/registrations': { target: 'http://localhost:8003', changeOrigin: true },
      '/notifications': { target: 'http://localhost:8004', changeOrigin: true },
    },
  },
});
