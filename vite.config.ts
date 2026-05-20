import babel from '@rolldown/plugin-babel';
import tailwindcss from '@tailwindcss/vite';
import { devtools } from '@tanstack/devtools-vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import { nitro } from 'nitro/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    // by default, lighningcss is used to minify the css
    // it badly polyfills and breaks light-dark on non-:root elems
    // there are many places from where it should read config to make it not do that, but does not
    // - https://www.npmjs.com/package/browserslist
    // - https://stackoverflow.com/questions/79739829/how-can-i-safely-introduce-the-use-of-light-dark-without-increasing-the-mini
    // - https://github.com/tailwindlabs/tailwindcss/issues/15438
    // - https://lightningcss.dev/transpilation.html
    // - https://github.com/tailwindlabs/tailwindcss/tree/HEAD/packages/@tailwindcss-vite
    // setting `cssTarget: false` stops lightningcss breaking light-dark
    // config key found here: https://github.com/tailwindlabs/tailwindcss/discussions/19530
    cssTarget: false,
  },
  plugins: [
    tailwindcss(),
    tanstackStart({ importProtection: { behavior: 'error', client: { excludeFiles: [/(^|\b)server(\b|$)/] } } }),
    devtools({ removeDevtoolsOnBuild: false }),
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    nitro({ minify: true }),
  ],
  resolve: { tsconfigPaths: true },
  server: { allowedHosts: true, host: true, port: 3000 },
});
