import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api/users': { target: 'http://localhost:8001', changeOrigin: true, rewrite: p => p.replace(/^\/api\/users/, '/users') },
      '/api/auth': { target: 'http://localhost:8001', changeOrigin: true, rewrite: p => p.replace(/^\/api\/auth/, '/auth') },
      '/api/admin': { target: 'http://localhost:8001', changeOrigin: true, rewrite: p => p.replace(/^\/api\/admin/, '/admin') },
      '/api/events': { target: 'http://localhost:8002', changeOrigin: true, rewrite: p => p.replace(/^\/api\/events/, '/events') },
      '/api/registrations': { target: 'http://localhost:8003', changeOrigin: true, rewrite: p => p.replace(/^\/api\/registrations/, '/registrations') },
      '/api/notifications': { target: 'http://localhost:8004', changeOrigin: true, rewrite: p => p.replace(/^\/api\/notifications/, '/notifications') },
    },
  },
});
