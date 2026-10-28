import { defineConfig } from 'vitest/config';

// Runs against the Firestore emulator (started by `npm run test:rules`).
export default defineConfig({
  test: { include: ['rules-tests/**/*.spec.ts'], environment: 'node', testTimeout: 20000 },
});
