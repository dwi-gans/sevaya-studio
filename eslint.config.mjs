import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

/**
 * Enforces the dependency direction documented in docs/ARCHITECTURE.md:
 *   app -> features -> integrations -> config
 *   app/features -> components
 */
const forbidImports = (layer, targets) => ({
  files: [`src/${layer}/**/*.{ts,tsx}`],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: targets.map((target) => ({
          group: [`@/${target}`, `@/${target}/**`],
          message: `"${layer}" must not import from "${target}". See docs/ARCHITECTURE.md.`,
        })),
      },
    ],
  },
});

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  forbidImports('components', ['app', 'features', 'integrations']),
  forbidImports('features', ['app']),
  forbidImports('integrations', ['app', 'features', 'components']),
  forbidImports('config', ['app', 'features', 'integrations', 'components']),
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
]);
