import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,        // 👈 force Vite to stay here
    open: true,        // 👈 automatically opens correct URL
    strictPort: true,  // 👈 ensure port is not changed
    proxy: {
      '/api': {
        target: 'http://localhost:5000', // <-- matches your backend port
        changeOrigin: true,
        secure: false,
      
      },
      '/uploads': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
      }
    },
  },
})
