// @ts-check

const eslint = require('@eslint/js')
const tseslint = require('typescript-eslint')
const eslintConfigPrettier = require('eslint-config-prettier')
const eslintPluginPrettier = require('eslint-plugin-prettier')
const globals = require('globals')

module.exports = tseslint.config(
  {
    ignores: ['dist/**', 'test/fixtures/**/output.json'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    plugins: {
      prettier: eslintPluginPrettier,
    },
    rules: {
      'prettier/prettier': 'error',
    },
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    files: ['test/**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
  },
  {
    files: ['test/fixtures/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
    },
  }
)
