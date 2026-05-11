import { expect, test } from "@playwright/test";

test("complete full interview session", async ({ page, request }) => {
  const email = `flow_${Date.now()}@test.dev`;
  const password = "password123";

  const baseURL = process.env.VITE_API_URL || "http://127.0.0.1:8000";
  await request.post(`${baseURL}/auth/register`, {
    data: { email, password, full_name: "Flow User" },
  });

  await page.goto("/login");
  await page.locator('[name="email"]').fill(email);
  await page.locator('[name="password"]').fill(password);
  await Promise.all([
    page.waitForURL(/\/dashboard$/, { timeout: 15_000 }),
    page.locator('button[type="submit"]').click(),
  ]);

  await page.goto("/sessions/new");
  await page.locator('input[type="checkbox"]').first().check();
  await page.locator('[data-testid="start-session-btn"]').click();

  await expect(page).toHaveURL(/\/interview\/\d+$/);

  const answerText =
    "This is a detailed placeholder answer that should satisfy validation rules cleanly.";

  for (let i = 0; i < 5; i += 1) {
    const currentQuestion = await page.getByRole("heading", { level: 3 }).textContent();
    const textarea = page.locator("textarea");
    await textarea.waitFor({ state: "visible" });
    await textarea.fill(answerText);

    await page.getByRole("button", { name: /Submit & continue|Complete interview/ }).click();
    await page.waitForFunction(
      (previousQuestion) =>
        window.location.pathname.includes("/results/")
        || document.querySelector("h3")?.textContent !== previousQuestion,
      currentQuestion,
    );
    if ((await page.url()).includes("/results/")) break;
  }

  await expect(page).toHaveURL(/\/results\/\d+$/);
});
