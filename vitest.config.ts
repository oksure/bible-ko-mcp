import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    // Integration tests hit bskorea.or.kr — allow up to 30 s per test
    testTimeout: 30000,
    hookTimeout: 30000,
    include: ['src/tests/**/*.test.ts'],
  },
});
