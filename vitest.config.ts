import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['vmd_parser/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['vmd_parser/**/*.ts'],
      exclude: ['vmd_parser/**/*.test.ts', 'vmd_parser/main.ts']
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './vmd_parser')
    }
  }
});
