import { defineConfig } from "@playwright/test";

const frontendHost = "127.0.0.1";
const frontendPort = 5173;
const backendPort = 8000;

export default defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: `http://${frontendHost}:${frontendPort}`,
    trace: "on-first-retry",
  },
  webServer: [
    {
      command: `cd ../backend && TESTING=1 SECRET_KEY=test-secret-key python3 -m uvicorn main:app --host ${frontendHost} --port ${backendPort}`,
      url: `http://${frontendHost}:${backendPort}/health`,
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: `npm run dev -- --host ${frontendHost} --port ${frontendPort}`,
      url: `http://${frontendHost}:${frontendPort}`,
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        ...process.env,
        VITE_API_URL: `http://${frontendHost}:${backendPort}`,
      },
    },
  ],
});
