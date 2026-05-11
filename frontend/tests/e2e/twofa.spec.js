import { expect, test } from "@playwright/test";

test("invalid totp code shows error message", async ({ page, request }) => {
  const email = `twofa_${Date.now()}@test.dev`;
  const password = "password123";

  const baseURL = process.env.VITE_API_URL || "http://127.0.0.1:8000";
  await request.post(`${baseURL}/auth/register`, {
    data: { email, password, full_name: "TOTP User" },
  });

  await page.goto("/login");
  await page.locator('[name="email"]').fill(email);
  await page.locator('[name="password"]').fill(password);
  await Promise.all([
    page.waitForURL(/\/dashboard$/, { timeout: 15_000 }),
    page.locator('button[type="submit"]').click(),
  ]);

  await page.goto("/2fa-setup");
  await page.getByRole("button", { name: "Setup TOTP (QR)" }).click();
  await expect(page.locator('[data-testid="qr-code-img"]')).toBeVisible();

  await page.goto("/2fa-verify");
  await page.locator('[name="totp_code"]').fill("000000");
  await page.locator('button[type="submit"]').click();
  await expect(page.locator(".error-message")).toBeVisible();
});
