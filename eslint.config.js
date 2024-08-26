import globals from 'globals'
import pluginJs from '@eslint/js'
import tseslint from 'typescript-eslint'
import { fixupConfigRules } from '@eslint/compat'
import eslintConfigPrettier from 'eslint-config-prettier'
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'

export default [
  pluginJs.configs.recommended,
  { languageOptions: { globals: globals.browser } },
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  eslintPluginPrettierRecommended,
  {
    settings: {},
    rules: {
      'prettier/prettier': [
        'error',
        {
          printWidth: 120,
          semi: false,
          singleQuote: true,
          trailingComma: 'es5',
          bracketSpacing: true,
          bracketSameLine: true,
        },
      ],
      // Diable config to avoid conflict with prettier config
      'max-len': 'off',
      semi: 'off',
      quotes: 'off',
      'comma-dangle': 'off',
      'object-curly-spacing': 'off',
      'array-bracket-spacing': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
]
