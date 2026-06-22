import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const usePolling = globalThis.process?.env?.VITE_USE_POLLING === 'true'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    watch: usePolling ? { usePolling: true } : undefined,
  },
})
