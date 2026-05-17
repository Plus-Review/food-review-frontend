import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Agar bisa diakses di luar container
    port: 5173,
    watch: {
      usePolling: true, // Gunakan polling agar perubahan file di Windows kedeteksi Docker
    },
  },
})