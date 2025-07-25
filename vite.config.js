import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Load env file based on mode
  const env = loadEnv(mode, process.cwd(), '')
  
  // Use test env variables when in test mode
  if (mode === 'test') {
    process.env.VITE_SUPABASE_URL = 'http://localhost:54321'
    process.env.VITE_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
  }
  
  return {
    plugins: [react()],
    base: '/weekmenu/',
    server: {
      port: 5174,
      watch: {
        usePolling: true
      }
    }
  }
})