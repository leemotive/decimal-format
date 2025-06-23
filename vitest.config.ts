import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'coverage/**',
        'dist/**',
        'lib/**',
        'es/**',
        'typings/**',
        '**/*.d.ts',
        'tests/**',
        '**/*.test.ts',
        'vitest.config.ts',
        'rollup.config.mjs',
      ],
      all: true,
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
  },
});
