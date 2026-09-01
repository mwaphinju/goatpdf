import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

/**
 * Regression guard for the dark-mode/theme-compatibility fix (see
 * THEME_ACCESSIBILITY_AUDIT.md). Asserts real, rendered contrast — not just
 * that a `dark:` class name is present — for a representative sample of text
 * across the app, in both color schemes. Shares its color-resolution
 * technique with static-pages.spec.ts's existing footer-contrast test
 * (Tailwind v4 reports colors via lab()/oklch() in getComputedStyle, not
 * legacy rgb(), so a 1x1 canvas is used to resolve any CSS color string to a
 * real sRGB pixel rather than hand-rolling that color-space math).
 */
function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const channel = c / 255;
    return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(rgb1: [number, number, number], rgb2: [number, number, number]): number {
  const l1 = relativeLuminance(...rgb1);
  const l2 = relativeLuminance(...rgb2);
  const [lighter, darker] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (lighter + 0.05) / (darker + 0.05);
}

/** Resolves a locator's real painted text-vs-background contrast ratio, walking up the DOM for the nearest ancestor that actually paints a background (mirrors static-pages.spec.ts). */
async function renderedContrastRatio(locator: ReturnType<Page["locator"]>): Promise<number> {
  const { color, backgroundColor } = await locator.evaluate((el) => {
    const rawColor = getComputedStyle(el).color;
    let node: Element | null = el;
    let rawBackground = "rgb(255, 255, 255)";
    while (node) {
      const bg = getComputedStyle(node).backgroundColor;
      if (bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") {
        rawBackground = bg;
        break;
      }
      node = node.parentElement;
    }

    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext("2d")!;
    function toRgb(cssColor: string): [number, number, number] {
      ctx.fillStyle = "#000";
      ctx.fillStyle = cssColor;
      ctx.fillRect(0, 0, 1, 1);
      const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
      return [r, g, b];
    }

    return { color: toRgb(rawColor), backgroundColor: toRgb(rawBackground) };
  });

  return contrastRatio(color, backgroundColor);
}

const COLOR_SCHEMES = ["light", "dark"] as const;

for (const colorScheme of COLOR_SCHEMES) {
  test.describe(`${colorScheme} mode`, () => {
    test.use({ colorScheme });

    test("homepage: hero heading, tool card, and CTA text meet WCAG AA contrast", async ({ page }) => {
      await page.goto("/");

      const heading = page.getByRole("heading", { level: 1, name: "Free PDF Tools That Just Work" });
      await expect(heading).toBeVisible();
      expect(await renderedContrastRatio(heading)).toBeGreaterThanOrEqual(4.5);

      const firstCardTitle = page.locator("main a[href^='/tools/'] span.font-semibold").first();
      await expect(firstCardTitle).toBeVisible();
      expect(await renderedContrastRatio(firstCardTitle)).toBeGreaterThanOrEqual(4.5);

      const ctaHeading = page.getByRole("heading", { level: 2, name: "No accounts, no watermarks, no catch" });
      await expect(ctaHeading).toBeVisible();
      expect(await renderedContrastRatio(ctaHeading)).toBeGreaterThanOrEqual(4.5);
    });

    test("header nav and footer text meet WCAG AA contrast", async ({ page }) => {
      await page.goto("/");

      const logo = page.locator("header a", { hasText: "GOAT PDF" });
      await expect(logo).toBeVisible();
      expect(await renderedContrastRatio(logo)).toBeGreaterThanOrEqual(4.5);

      const footerCopyright = page.locator("footer p", { hasText: "GOAT PDF. All processing" });
      await expect(footerCopyright).toBeVisible();
      expect(await renderedContrastRatio(footerCopyright)).toBeGreaterThanOrEqual(4.5);

      const footerLink = page.locator("footer").getByRole("link", { name: "Privacy Policy" }).first();
      await expect(footerLink).toBeVisible();
      expect(await renderedContrastRatio(footerLink)).toBeGreaterThanOrEqual(4.5);
    });

    test("a tool page: heading, description, and upload hint meet WCAG AA contrast", async ({ page }) => {
      await page.goto("/tools/merge-pdf");

      const heading = page.getByRole("heading", { level: 1, name: "Merge PDF" });
      await expect(heading).toBeVisible();
      expect(await renderedContrastRatio(heading)).toBeGreaterThanOrEqual(4.5);

      const uploadHint = page.getByText("Up to 20 files, 50 MB each.");
      await expect(uploadHint).toBeVisible();
      expect(await renderedContrastRatio(uploadHint)).toBeGreaterThanOrEqual(4.5);

      // The primary button starts disabled (no files uploaded yet) — WCAG
      // 1.4.3 explicitly exempts inactive controls from the 4.5:1 text
      // contrast requirement, so this only checks it isn't truly invisible,
      // not full AA compliance.
      const primaryButton = page.getByRole("button", { name: "Merge PDFs" });
      await expect(primaryButton).toBeVisible();
      expect(await renderedContrastRatio(primaryButton)).toBeGreaterThan(1.2);
    });

    test("a legal page: heading and body text meet WCAG AA contrast", async ({ page }) => {
      await page.goto("/privacy");

      const heading = page.getByRole("heading", { level: 1, name: "Privacy Policy" });
      await expect(heading).toBeVisible();
      expect(await renderedContrastRatio(heading)).toBeGreaterThanOrEqual(4.5);

      const bodyText = page.locator("main p").first();
      await expect(bodyText).toBeVisible();
      expect(await renderedContrastRatio(bodyText)).toBeGreaterThanOrEqual(4.5);
    });

    test("no element renders identical foreground and background color (catches invisible text)", async ({ page }) => {
      await page.goto("/tools/compress-pdf");

      const texts = await page.locator("h1, h2, p, span, a, button, label, legend").all();
      const results = await Promise.all(
        texts.slice(0, 40).map(async (locator) => {
          const isVisible = await locator.isVisible().catch(() => false);
          if (!isVisible) return null;
          const hasText = ((await locator.textContent()) ?? "").trim().length > 0;
          if (!hasText) return null;
          return renderedContrastRatio(locator).catch(() => null);
        }),
      );

      for (const ratio of results) {
        if (ratio === null) continue;
        // 1.0 would mean identical foreground/background — genuinely invisible text.
        expect(ratio).toBeGreaterThan(1.2);
      }
    });
  });
}
