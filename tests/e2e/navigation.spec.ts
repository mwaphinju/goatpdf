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

  test("the language selector shows English as current and Deutsch as a real link to the German homepage", async ({
    page,
  }) => {
    await page.goto("/");
    const selector = page.locator("header details").filter({ hasText: "English" });
    await expect(selector).not.toHaveAttribute("open", "");

    await selector.locator("summary").click();
    await expect(selector).toHaveAttribute("open", "");
    await expect(selector.getByText("Current")).toBeVisible();

    // German is ready as of Week 2 Day 5 (see @/i18n/config's
    // READY_LOCALES), so Deutsch is a real link, not a disabled
    // "Coming soon" option: German-specific coverage (per-page mapping,
    // English pages with no German equivalent) lives in
    // tests/e2e/german-pages.spec.ts.
    await expect(selector.getByRole("link", { name: "Deutsch" })).toHaveAttribute("href", "/de");
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

  test("the mobile menu includes a language selector that links to the German homepage", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Open menu" }).click();

    const mobileNav = page.locator("#mobile-nav");
    const selector = mobileNav.locator("details");
    await selector.locator("summary").click();
    await expect(selector.getByRole("link", { name: "Deutsch" })).toHaveAttribute("href", "/de");
  });

  test("the mobile language selector shows the current language name, not just an icon", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Open menu" }).click();

    const mobileNav = page.locator("#mobile-nav");
    const selector = mobileNav.locator("details");
    await expect(selector.locator("summary").getByText("English")).toBeVisible();
  });

  test("the mobile language selector opens to show both languages, with English marked current", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Open menu" }).click();

    const mobileNav = page.locator("#mobile-nav");
    const selector = mobileNav.locator("details");
    await expect(selector).not.toHaveAttribute("open", "");

    await selector.locator("summary").click();
    await expect(selector).toHaveAttribute("open", "");
    await expect(selector.getByText("Current")).toBeVisible();
    await expect(selector.getByRole("link", { name: "Deutsch" })).toBeVisible();
  });

  test("the mobile language selector navigates from an English tool page to its exact German counterpart", async ({
    page,
  }) => {
    await page.goto("/tools/compress-pdf");
    await page.getByRole("button", { name: "Open menu" }).click();

    const mobileNav = page.locator("#mobile-nav");
    const selector = mobileNav.locator("details").filter({ hasText: "English" });
    await selector.locator("summary").click();
    await selector.getByRole("link", { name: "Deutsch" }).click();

    await expect(page).toHaveURL(/\/de\/tools\/pdf-komprimieren$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "de");
  });

  test("the mobile menu with the language selector open causes no horizontal overflow", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Open menu" }).click();

    const mobileNav = page.locator("#mobile-nav");
    const selector = mobileNav.locator("details");
    await selector.locator("summary").click();

    const [scrollWidth, clientWidth] = await page.evaluate(() => [
      document.documentElement.scrollWidth,
      document.documentElement.clientWidth,
    ]);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });

  test("the mobile menu renders exactly one language control, not a duplicate", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Open menu" }).click();

    const mobileNav = page.locator("#mobile-nav");
    await expect(mobileNav.getByLabel(/^Language:/)).toHaveCount(1);
  });
});
