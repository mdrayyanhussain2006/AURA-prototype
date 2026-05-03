import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Node environment for testing main-process services
    environment: 'node',
    include: ['tests/**/*.test.{js,ts}'],
    globals: true
  }
});
