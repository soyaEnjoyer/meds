import tanstackQuery from '@tanstack/eslint-plugin-query';
import tanstackRouter from '@tanstack/eslint-plugin-router';
import reactCompiler from 'eslint-plugin-react-compiler';
import { defineConfig } from 'oxlint';

// @ts-expect-error oxlint config requires the .ts extension
import baseConfig from './oxlint.config.ts';

// jsPlugins depend on legacy eslint stuff and are slow

export default defineConfig({
  extends: [baseConfig],
  ignorePatterns: baseConfig.ignorePatterns,
  jsPlugins: [
    {
      name: 'tanstack-query',
      specifier: '@tanstack/eslint-plugin-query',
    },
    {
      name: 'tanstack-router',
      specifier: '@tanstack/eslint-plugin-router',
    },
    {
      name: 'react-compiler',
      specifier: 'eslint-plugin-react-compiler',
    },
  ],
  rules: {
    ...baseConfig.rules,
    ...Object.fromEntries(Object.keys(tanstackQuery.rules).map((rule) => [`tanstack-query/${rule}`, 'warn'])),
    ...Object.fromEntries(Object.keys(tanstackRouter.rules).map((rule) => [`tanstack-router/${rule}`, 'warn'])),
    'tanstack-query/prefer-query-options': 'off',
    ...Object.fromEntries(Object.keys(reactCompiler.rules).map((rule) => [`react-compiler/${rule}`, 'warn'])),
  },
});
