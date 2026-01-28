import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"
import tailwindcss from "@tailwindcss/vite"
import generateHooksPlugin from './plugins/generate-hooks'; // Import your plugin
import generateStatesPlugin from './plugins/generate-states';
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), generateHooksPlugin(), generateStatesPlugin(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  
})
