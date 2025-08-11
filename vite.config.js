import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: 'localhost',   // or '127.0.0.1' if localhost is flaky on your setup
    port: 5174,          // match the port you run
    strictPort: true,
    hmr: {
      protocol: 'ws',
      host: 'localhost', // or '127.0.0.1'
      port: 5174,
    },
  },
})
