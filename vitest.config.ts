/// <reference types="vitest" />
import path from "path"; // Added path import
import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    globals: true, // Makes describe, it, expect, etc. globally available
    environment: "jsdom", // Use JSDOM for tests that need a browser-like environment
    setupFiles: "./vitest.setup.ts", // Optional: For global test setup (e.g., jest-dom matchers)
    // coverage: {
    //   provider: 'v8', // or 'istanbul'
    //   reporter: ['text', 'json', 'html'],
    //   reportsDirectory: './coverage',
    // },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    testTimeout: 10000, // 10 seconds per test file
    hookTimeout: 10000, // 10 seconds for hooks per test file
    // Explicitly define where to find tests and what to exclude
    include: ["src/**/*.{test,spec}.?(c|m)[jt]s?(x)"],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/cypress/**",
      "**/.{idea,git,cache,output,temp}/**",
      "**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,eslint,esbuild}.config.*",
      "tests-e2e/**", // Keep existing exclusion for e2e tests
    ],
  },
});
