import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"
import tailwindcss from "@tailwindcss/vite"
import generateHooksPlugin from './plugins/generate-hooks';
import generateStatesPlugin from './plugins/generate-states';
import generateLocksPlugin from './plugins/generate-locks';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on mode
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [
      react(),
      generateHooksPlugin({
        schemaUrl: env.VITE_SCHEMA_IMPLEMENTATION_URL,
      }),
      generateStatesPlugin({
        schemaUrl: env.VITE_SCHEMA_STATES_URL,
      }),
      generateLocksPlugin({
        schemaUrl: env.VITE_SCHEMA_LOCKS_URL,
      }),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
