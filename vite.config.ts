import babel from '@rolldown/plugin-babel';
import tailwindcss from '@tailwindcss/vite';
import { devtools } from '@tanstack/devtools-vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import basicSsl from '@vitejs/plugin-basic-ssl';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import { nitro } from 'nitro/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    tanstackStart({ importProtection: { behavior: 'error', client: { excludeFiles: [/(^|\b)server(\b|$)/] } } }),
    devtools(),
    tailwindcss({ optimize: { minify: true } }),
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    basicSsl(),
    nitro({ minify: true }),
  ],
  resolve: { tsconfigPaths: true },
  server: { allowedHosts: true, host: true, port: 3000 },
});
