import { expect, test } from "@playwright/test";

const PAGES = [
  { path: "/privacy", heading: "Privacy Policy", footerLabel: "Privacy Policy" },
  { path: "/terms", heading: "Terms of Service", footerLabel: "Terms of Service" },
  { path: "/about", heading: "About GOAT PDF", footerLabel: "About" },
  { path: "/contact", heading: "Contact", footerLabel: "Contact" },
];

for (const page of PAGES) {
  test(`${page.path} loads with its heading and is reachable from the footer`, async ({ page: browserPage }) => {
    await browserPage.goto(page.path);
    await expect(browserPage.getByRole("heading", { level: 1, name: page.heading })).toBeVisible();

    await browserPage.goto("/");
    await expect(browserPage.locator("footer").getByRole("link", { name: page.footerLabel }).first()).toBeVisible();
  });
}

test("security headers are present on the homepage response", async ({ page }) => {
  const response = await page.goto("/");
  expect(response).not.toBeNull();
  const headers = response!.headers();

  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["content-security-policy"]).toContain("default-src 'self'");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
});
