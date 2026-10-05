import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    pool: 'forks',
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 30000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'html'],
      all: true,
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.d.ts',
        'src/types/**',
        'src/utils/pdfCanvasTypes.ts'
      ],
      thresholds: {
        lines: 80,
        statements: 80,
        branches: 70,
        functions: 80,
        perFile: false,
        autoUpdate: false
      }
    }
  }
});
