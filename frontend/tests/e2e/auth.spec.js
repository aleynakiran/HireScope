import { expect, test } from "@playwright/test";

test("redirects unauthenticated user from dashboard", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);
});

test("login flow works", async ({ page, request }) => {
  const email = `e2e_${Date.now()}@test.dev`;
  const password = "password123";

  const baseURL = process.env.VITE_API_URL || "http://127.0.0.1:8000";
  const registerResp = await request.post(`${baseURL}/auth/register`, {
    data: { email, password, full_name: "Playwright User" },
  });
  expect(registerResp.ok()).toBeTruthy();

  await page.goto("/login");
  await page.locator('[name="email"]').fill(email);
  await page.locator('[name="password"]').fill(password);
  await Promise.all([
    page.waitForURL(/\/dashboard$/, { timeout: 15_000 }),
    page.locator('button[type="submit"]').click(),
  ]);
});

test("google oauth button is visible on login page", async ({ page }) => {
  await page.goto("/login");
  await expect(page.locator('[data-testid="google-login-btn"]')).toBeVisible();
});

test("github oauth button is visible on login page", async ({ page }) => {
  await page.goto("/login");
  await expect(page.locator('[data-testid="github-login-btn"]')).toBeVisible();
});
