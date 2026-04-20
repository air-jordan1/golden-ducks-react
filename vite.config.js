import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
   build: {
    outDir: 'public', // This outputs "npm run build" to the "public" directory for deployment to firebase
  },
})
