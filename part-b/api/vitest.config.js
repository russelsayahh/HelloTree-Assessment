import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // The API tests share one database, so files must not run concurrently.
    fileParallelism: false,
  },
});
