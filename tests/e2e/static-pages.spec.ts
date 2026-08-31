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

// Regression guard for MVP audit finding A11Y-1: text-slate-400 fails WCAG
// AA's 4.5:1 minimum for normal text (2.56:1 on white, 2.51:1 on the
// footer's actual slate-50 background). The footer was fixed to
// text-slate-600 (~7.2:1 against slate-50 — text-slate-500 only clears
// slate-50 by ~4.55:1, too thin a margin to rely on); other locations that
// sit on plain white (upload hint text, file-size labels) were fixed to
// text-slate-500 (4.76:1). This asserts the real, rendered contrast rather
// than just the class name, so it fails again if the color ever regresses.
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

test("footer text meets WCAG AA contrast (4.5:1) against its actual rendered background", async ({ page }) => {
  await page.goto("/");
  const footerText = page.locator("footer p", { hasText: "GOAT PDF. All processing" });

  const { color, backgroundColor } = await footerText.evaluate((el) => {
    const rawColor = getComputedStyle(el).color;
    // Walk up from the text node to find the nearest ancestor that actually
    // paints a background — the footer's own bg-slate-50, not document.body's
    // white, is what this text is really rendered against.
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

    // Modern Chrome reports Tailwind v4's OKLCH-defined colors back out of
    // getComputedStyle() in lab()/oklch() notation, not legacy rgb(). Rather
    // than hand-rolling that color-space math, let the browser's own Canvas
    // 2D context resolve any CSS color string to a plain sRGB pixel.
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

  const ratio = contrastRatio(color, backgroundColor);
  expect(ratio).toBeGreaterThanOrEqual(4.5);
});
