import globals from 'globals';
import tseslint from '@typescript-eslint/eslint-plugin';
import react from 'eslint-plugin-react';
import parser from '@typescript-eslint/parser';

export default [
  {
    ignores: ['dist/**', 'coverage/**', '*.js.map'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
      parser: parser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        ecmaVersion: 12,
        sourceType: 'module',
      },
    },
    plugins: {
      react,
      '@typescript-eslint': tseslint,
    },
    rules: {
      'react/react-in-jsx-scope': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': 'warn',
      'no-unused-vars': 'warn',
      ...react.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  }
];
