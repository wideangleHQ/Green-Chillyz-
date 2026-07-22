import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    root: './src',
    environment: 'node',
    include: ['**/*.{test,spec}.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['**/*.module.ts', '**/index.ts', '**/main.ts'],
    },
  },
  resolve: {
    alias: {
      '@config': path.resolve(__dirname, 'src/config'),
      '@common': path.resolve(__dirname, 'src/common'),
      '@database': path.resolve(__dirname, 'src/database'),
      '@modules': path.resolve(__dirname, 'src/modules'),
      '@providers': path.resolve(__dirname, 'src/providers'),
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@types': path.resolve(__dirname, 'src/types'),
    },
  },
});
