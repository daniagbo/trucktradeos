import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // Keep integration tests serial to avoid shared DB state races.
    maxConcurrency: 1,
    setupFiles: ['tests/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Next.js markers/modules not available under plain Vitest/Vite.
      'server-only': path.resolve(__dirname, './tests/stubs/server-only.ts'),
      'next/headers': path.resolve(__dirname, './tests/stubs/next-headers.ts'),
    },
  },
});
