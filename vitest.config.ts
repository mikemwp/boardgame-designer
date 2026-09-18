import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    env: {
      NEXT_PUBLIC_APP_NAME: 'Building Board Template',
    },
  },
  resolve: { alias: { '@': path.resolve(__dirname, '.') } },
});
