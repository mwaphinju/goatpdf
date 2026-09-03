import { expect, test } from "@playwright/test";

test.describe("Desktop Chrome", () => {
  test.skip(({ isMobile }) => isMobile, "desktop-only navigation");

  test("the Tools dropdown opens and links to a tool page", async ({ page }) => {
    await page.goto("/");
    const details = page.locator("header details").filter({ hasText: "Tools" });
    await expect(details).not.toHaveAttribute("open", "");

    await details.locator("summary").click();
    await expect(details).toHaveAttribute("open", "");

    await details.getByRole("link", { name: "Rotate PDF" }).click();
    await expect(page).toHaveURL(/\/tools\/rotate-pdf$/);
  });

  test("the language selector shows English as current and German as not yet available", async ({ page }) => {
    await page.goto("/");
    const selector = page.locator("header details").filter({ hasText: "English" });
    await expect(selector).not.toHaveAttribute("open", "");

    await selector.locator("summary").click();
    await expect(selector).toHaveAttribute("open", "");
    await expect(selector.getByText("Current")).toBeVisible();
    await expect(selector.getByText("Deutsch")).toBeVisible();
    await expect(selector.getByText("Coming soon")).toBeVisible();

    // Neither option is a link: English has nothing to navigate to (it's
    // the page already open), and German isn't a real page yet.
    await expect(selector.getByRole("link")).toHaveCount(0);
  });
});

test.describe("Mobile Chrome", () => {
  test.skip(({ isMobile }) => !isMobile, "mobile-only navigation");

  test("the mobile menu toggles open and links to a tool page", async ({ page }) => {
    await page.goto("/");
    const mobileNav = page.locator("#mobile-nav");
    await expect(mobileNav).toBeHidden();

    await page.getByRole("button", { name: "Open menu" }).click();
    await expect(mobileNav).toBeVisible();

    await mobileNav.getByRole("link", { name: "Split PDF" }).click();
    await expect(page).toHaveURL(/\/tools\/split-pdf$/);
  });

  test("the mobile menu includes a language selector that stays on the page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Open menu" }).click();

    const mobileNav = page.locator("#mobile-nav");
    const selector = mobileNav.locator("details");
    await selector.locator("summary").click();
    await expect(selector.getByText("Deutsch")).toBeVisible();
    await expect(selector.getByText("Coming soon")).toBeVisible();
    await expect(page).toHaveURL("/");
  });
});
