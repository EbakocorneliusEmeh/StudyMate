// https://docs.expo.dev/guides/using-eslint/
// Using minimal config to avoid eslint-plugin-react incompatibility with ESLint 10
import tseslint from 'typescript-eslint';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  {
    ignores: ['dist/*', 'node_modules/*', '.expo/*', '.expo-web/*', 'src/*'],
  },
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
]);
