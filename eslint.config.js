import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    rules: {
      // Surface unused symbols without failing CI on pre-existing debt; allow
      // intentional `_`-prefixed throwaways. Tighten to 'error' once burned down.
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' },
      ],
    },
  },
  {
    // Vendored shadcn/ui primitives intentionally co-locate `cva` variant
    // constants with their components, which trips this dev-only fast-refresh
    // rule. It has no correctness impact, so disable it for generated UI code.
    files: ['src/app/components/ui/**/*.{ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    // Test files and shared test utilities are never part of the Fast Refresh
    // graph (the helper re-exports Testing Library alongside its render wrapper),
    // so the component-export constraint doesn't apply here.
    files: ['src/test/**/*.{ts,tsx}', '**/*.test.{ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
)
