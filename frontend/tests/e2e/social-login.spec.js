import { expect, test } from "@playwright/test";

test("all social login buttons are visible", async ({ page }) => {
  await page.goto("/login");
  await expect(page.locator('[data-testid="google-login-btn"]')).toBeVisible();
  await expect(page.locator('[data-testid="github-login-btn"]')).toBeVisible();
  await expect(page.locator('[data-testid="linkedin-login-btn"]')).toBeVisible();
  await expect(page.locator('[data-testid="discord-login-btn"]')).toBeVisible();
});
