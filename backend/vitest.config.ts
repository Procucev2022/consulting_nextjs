import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true
      }
    },
    testTimeout: 10000,
    hookTimeout: 120000,
    teardownTimeout: 30000,
    env: {
      AICEV_DATA_DIR: 'c:/Users/srini/Desktop/Antigravity Consulting Files/consulting_nextjs/data/test',
      AICEV_ALLOW_SAMPLE_FIXTURES: 'true'
    },
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
