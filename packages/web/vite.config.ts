import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['425f-2a0d-6fc0-297d-bb00-686f-449f-1c4d-30d0.ngrok-free.app']
  },
});
