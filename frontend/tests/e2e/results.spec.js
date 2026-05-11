import { expect, test } from "@playwright/test";

test("results page shows overall score", async ({ page, request }) => {
  test.setTimeout(120_000);
  const email = `results_${Date.now()}@test.dev`;
  const password = "password123";
  const baseURL = process.env.VITE_API_URL || "http://127.0.0.1:8000";

  await request.post(`${baseURL}/auth/register`, {
    data: { email, password, full_name: "Result User" },
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

  const answer = "This answer includes concrete details and examples to pass minimum validation.";
  for (let i = 0; i < 5; i += 1) {
    const textarea = page.locator("textarea");
    await textarea.fill(answer);
    await expect(textarea).toHaveValue(answer);

    const submitBtn = page.getByRole("button", { name: /Submit & continue|Complete interview/ });
    await expect(submitBtn).toBeEnabled();
    const isLast = (await submitBtn.textContent())?.includes("Complete interview");
    const answerSubmit = page.waitForResponse(
      (res) =>
        res.url().includes("/answers")
        && res.request().method() === "POST"
        && res.status() === 200,
    );
    await submitBtn.click();
    await answerSubmit;

    if (isLast) {
      await page.waitForURL(/\/results\/\d+$/);
      break;
    }

    await expect(page.getByText(new RegExp(`^${i + 1}/5$`))).toBeVisible();
  }

  await expect(page).toHaveURL(/\/results\/\d+$/);
  await expect(page.locator(".overall-score")).toBeVisible();
});
