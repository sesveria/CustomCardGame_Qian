import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',    // relative paths → works with file:// or any subfolder
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,  // don't inline anything as base64
  },
})
