import { expect, test } from "@playwright/test";

test("non-admin cannot access admin panel", async ({ page, request }) => {
  const email = `admin_block_${Date.now()}@test.dev`;
  const password = "password123";
  const baseURL = process.env.VITE_API_URL || "http://127.0.0.1:8000";

  const registerResp = await request.post(`${baseURL}/auth/register`, {
    data: { email, password, full_name: "Non Admin User" },
  });
  expect(registerResp.ok()).toBeTruthy();

  await page.goto("/login");
  await page.locator('[name="email"]').fill(email);
  await page.locator('[name="password"]').fill(password);
  await page.locator('button[type="submit"]').click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto("/admin");
  await expect(page).toHaveURL(/\/dashboard$/);
});
