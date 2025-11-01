import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        allowedHosts: [
          'tasty-pets-sin.loca.lt',
          'orange-beers-watch.loca.lt',
          '.loca.lt',
          '.ngrok.io',
          '.ngrok-free.app',
        ],
        hmr: {
          clientPort: 443,
        },
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.SUPABASE_URL': JSON.stringify(env.SUPABASE_URL),
        'process.env.SUPABASE_ANON_KEY': JSON.stringify(env.SUPABASE_ANON_KEY),
        'process.env.VIDEO_MAX_DURATION': JSON.stringify(env.VITE_VIDEO_MAX_DURATION || '10'),
        'process.env.VIDEO_MAX_FILE_SIZE': JSON.stringify(env.VITE_VIDEO_MAX_FILE_SIZE || '20971520')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
