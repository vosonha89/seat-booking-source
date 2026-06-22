const globals = require('globals');
const tseslint = require('@typescript-eslint/eslint-plugin');
const react = require('eslint-plugin-react');
const parser = require('@typescript-eslint/parser');

module.exports = [
  {
    ignores: ['dist'],
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
