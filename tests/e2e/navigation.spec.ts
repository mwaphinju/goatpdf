import { expect, test } from "@playwright/test";

test.describe("Desktop Chrome", () => {
  test.skip(({ isMobile }) => isMobile, "desktop-only navigation");

  test("the Tools dropdown opens and links to a tool page", async ({ page }) => {
    await page.goto("/");
    const details = page.locator("header details");
    await expect(details).not.toHaveAttribute("open", "");

    await page.locator("header details summary").click();
    await expect(details).toHaveAttribute("open", "");

    await details.getByRole("link", { name: "Rotate PDF" }).click();
    await expect(page).toHaveURL(/\/tools\/rotate-pdf$/);
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
});
