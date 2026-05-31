import { defineConfig } from 'oxfmt';

export default defineConfig({
  ignorePatterns: ['**/*.gen.ts', '/migrations'],
  jsxSingleQuote: true,
  printWidth: 120,
  singleQuote: true,
  sortImports: {
    partitionByNewline: false,
  },
  sortPackageJson: true,
  sortTailwindcss: {
    stylesheet: 'src/globals.css',
  },
  trailingComma: 'es5',
});
