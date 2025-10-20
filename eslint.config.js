import eslintPluginTs from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'

export default [
  {
    ignores: ['dist', 'node_modules']
  },
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
        sourceType: 'module',
        ecmaVersion: 2022
      }
    },
    plugins: {
      '@typescript-eslint': eslintPluginTs
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '(^_$)|(^__$)',
          varsIgnorePattern: '(^_$)|(^__$)'
        }
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      'semi': ['error', 'always'],
      '@typescript-eslint/explicit-function-return-type': 'error',
      'quotes': [
        'error',
        'single',
        {
          'avoidEscape': true
        }
      ]
    }
  }
]
