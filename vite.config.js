import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
   build: {
    outDir: 'builtFiles', // This outputs "npm run build" to the "builtFiles" directory for deployment to firebase
  },
})
