import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// base './' → derlenen site hangi adreste yayınlanırsa yayınlansın çalışır
// (kullanici.github.io kökü de olur, kullanici.github.io/portfolyo alt klasörü de).
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
});
