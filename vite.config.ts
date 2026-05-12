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
    // lightningcss polyfills light-dark badly and breaks it
    // https://stackoverflow.com/questions/79739829/how-can-i-safely-introduce-the-use-of-light-dark-without-increasing-the-mini
    // https://github.com/tailwindlabs/tailwindcss/issues/15438
    tailwindcss({ optimize: false }),
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    basicSsl({
      domains: ['localhost', '*.lan'],
    }),
    nitro({ minify: true }),
  ],
  resolve: { tsconfigPaths: true },
  server: { allowedHosts: true, host: true, port: 3000 },
});
