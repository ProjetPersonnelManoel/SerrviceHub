import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Variables lues à l'import des modules (jwt.ts) : définies avant le .env
    env: {
      NODE_ENV: "test",
      JWT_SECRET: "test-secret",
      JWT_EXPIRES_IN: "1h",
    },
  },
});
