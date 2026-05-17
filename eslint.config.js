import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

// The design-spec color guard lives in `scripts/lint-colors.mjs` and runs as a
// separate CI step (`pnpm lint:colors`). Custom regex banning is awkward in
// flat-config ESLint; the script is the single source of truth.

export default [
  {
    ignores: ['dist', 'node_modules', 'public', '.vercel', 'coverage'],
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      react: reactPlugin,
      'react-hooks': reactHooks,
    },
    settings: { react: { version: '18.3' } },
    rules: {
      ...tseslint.configs.recommended.rules,
      ...reactPlugin.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  {
    // R3F adds <mesh>, <pointLight>, etc. as intrinsic elements with
    // three.js prop surfaces (intensity, position, args, …) that the
    // default react/no-unknown-property rule doesn't know about. Scope
    // the disable narrowly to scene files — DOM components stay guarded.
    files: ['src/scenes/**/*.tsx'],
    plugins: { react: reactPlugin },
    rules: {
      'react/no-unknown-property': 'off',
    },
  },
];
