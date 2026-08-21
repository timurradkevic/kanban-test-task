import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import nPlugin from 'eslint-plugin-n';

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
        projectService: true,
      },
    },
    plugins: {
      n: nPlugin,
    },
    rules: {
      ...nPlugin.configs['flat/recommended-module'].rules,
      'n/no-missing-import': 'off',
      'n/no-unsupported-features/es-syntax': 'off',
      'n/no-unpublished-import': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
);
