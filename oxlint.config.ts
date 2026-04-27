import tanstackQuery from '@tanstack/eslint-plugin-query';
import tanstackRouter from '@tanstack/eslint-plugin-router';
import reactCompiler from 'eslint-plugin-react-compiler';
import { defineConfig } from 'oxlint';

export default defineConfig({
  categories: {
    correctness: 'error',
    pedantic: 'off',
    perf: 'warn',
    restriction: 'warn',
    style: 'warn',
    suspicious: 'warn',
  },
  env: {
    builtin: true,
  },
  globals: {},
  ignorePatterns: ['**/*.gen.ts', '/migrations'],
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
  options: {
    typeAware: true,
    typeCheck: true,
  },
  overrides: [
    {
      files: [
        '*.config.ts',
        '**/*.server/**',
        '**/*.server.ts',
        'src/routes/__root.tsx',
        'src/routes/api/**',
        'src/server.ts',
      ],
      rules: {
        'import/no-nodejs-modules': 'off',
      },
    },
    {
      files: ['*.tsx', 'src/hooks/**', 'src/routes/**'],
      rules: {
        'eslint/no-use-before-define': 'off',
        'typescript/explicit-function-return-type': 'off',
        'typescript/explicit-module-boundary-types': 'off',
      },
    },
    {
      files: ['*.config.ts', 'src/server.ts'],
      rules: {
        'import/no-default-export': 'off',
      },
    },
  ],
  plugins: ['eslint', 'import', 'jsdoc', 'jsx-a11y', 'node', 'oxc', 'promise', 'react', 'react-perf', 'typescript'],
  rules: {
    'eslint/capitalized-comments': 'off',
    'eslint/curly': 'off',
    'eslint/func-style': 'off',
    'eslint/id-length': 'off',
    'eslint/max-params': 'off',
    'eslint/max-statements': 'off',
    'eslint/no-console': 'off',
    'eslint/no-duplicate-imports': 'off',
    'eslint/no-magic-numbers': 'off',
    'eslint/no-nested-ternary': 'off',
    'eslint/no-ternary': 'off',
    'eslint/no-undefined': 'off',
    'eslint/no-void': 'off',
    'eslint/sort-imports': 'off',
    'import/consistent-type-specifier-style': 'off',
    'import/exports-last': 'off',
    'import/group-exports': 'off',
    'import/no-duplicates': 'off',
    'import/no-named-export': 'off',
    'import/prefer-default-export': 'off',
    'label-has-associated-control': 'off',
    'oxc/no-async-await': 'off',
    'oxc/no-optional-chaining': 'off',
    'oxc/no-rest-spread-properties': 'off',
    'react-perf/jsx-no-jsx-as-prop': 'off',
    'react/jsx-filename-extension': [
      'warn',
      {
        extensions: ['jsx', 'tsx'],
      },
    ],
    'react/jsx-max-depth': 'off',
    'react/jsx-props-no-spreading': 'off',
    'react/no-multi-comp': 'off',
    'react/only-export-components': 'off',
    'react/react-in-jsx-scope': 'off',
    ...Object.fromEntries(Object.keys(tanstackQuery.rules).map((rule) => [`tanstack-query/${rule}`, 'warn'])),
    ...Object.fromEntries(Object.keys(tanstackRouter.rules).map((rule) => [`tanstack-router/${rule}`, 'warn'])),
    'tanstack-query/prefer-query-options': 'off',
    ...Object.fromEntries(Object.keys(reactCompiler.rules).map((rule) => [`react-compiler/${rule}`, 'warn'])),
  },
  settings: {
    jsdoc: {
      augmentsExtendsReplacesDocs: false,
      exemptDestructuredRootsFromChecks: false,
      ignoreInternal: false,
      ignorePrivate: false,
      ignoreReplacesDocs: true,
      implementsReplacesDocs: false,
      overrideReplacesDocs: true,
      tagNamePreference: {},
    },
    'jsx-a11y': {
      attributes: {},
      components: {},
      polymorphicPropName: 'as',
    },
    next: {
      rootDir: [],
    },
    react: {
      componentWrapperFunctions: [],
      formComponents: [],
      linkComponents: ['Link'],
      version: '19.2',
    },
    vitest: {
      typecheck: false,
    },
  },
});
